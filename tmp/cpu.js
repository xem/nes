/* CPU: Ricoh RP2A03 (based on MOS6502, almost the same as in Commodore 64) */

// Declares the standard 2KiB of NES RAM accessible by the CPU
RAM = [];

// Set variables for managing CPU contexts and triggers: reset, non-maskable interrupt disable, edge state comparator, and current interrupt state. 
// These are specifically used for interrupt control during Op loops and certain external events within the APU.
// Most of these variables are already part of processor status register (defined later on line 775).
// The difference is that the processor registers are (generally) controlled by the running program, and these are controlled by the kernel.
reset = true;
nmi = false;
nmi_edge_detected = false;
intr = false;

// Define procedure for actions that happen outside the CPU during every CPU tick.
CPU_tick = function(){

  // The PPU processes three times for every CPU tick.
  for(n = 0; n < 3; ++n){
    PPU_tick();
  }
  
  // The APU processes once for every CPU tick.
  APU_tick();
}

// Handle byte-level reads and writes.
// Much of the work here is to process memory mappings and call the appropriate namespace read/write functions with the modified address.
// Input arguments include a 16-bit CPU-mapped address and an input value for writing.
MemAccess = function(addr, v){

  // Write mode is on if the second parameter is not set
  write = (v !== undefined);
  
  // During reset state (ex. the first CPU cycle), all calls to MemAccess are treated as reads
  if(reset && write){
    return MemAccess(addr);
  }

  // Process a CPU background tick -- The PPU ticks 3x and the APU ticks 1x.
  CPU_tick();
  
  // Map the memory from CPU's viewpoint:
  
  // If the memory address is less than 0x2000 (8KiB), then we're interested in the NES RAM, which occupies the lower 0x800 (2KiB) of the address space.
  // Get a reference to the target address in RAM. For read operations, return the reference. For writes, store the input value at that address.
  if(addr < 0x2000){
    r = RAM[addr & 0x7FF];
    if(!write){
      return r;
    }
    r = v;
  }
  
  // If the memory access is between 0x2000 and 0x4000 (8KiB and 16KiB), then forward the memory access request to the PPU via PPU_Access and mask the lower3 bits.
  // Recall that PPU uses 8 ports from 0x2000 to 0x2008, so we only need those three bits to map correctly.
  else if(addr < 0x4000){
    return PPU_Access(addr & 7, v, write);
  }

  // If the memory access is between 0x4000 and 0x4018, then we're dealing with I/O for DMA functions for either PPU, APU, or Joystick.
  else if(addr < 0x4018){
    
    // Mask the lower 5 bits and compare to find appropriate DMA handler
    switch(addr & 0x1F){
    
      // If accessing CPU memory at 0x4014:
      // Writing to 0x4014 initiates CPU-blocking 256-byte block transfer of OAM Data from one of the eight 256-byte RAM pages indexed by v.
      // The data is written to the OAMDATA port 0x2004. This actual write is handled in PPU_Access
      case 0x14: // OAM DMA: Copy 256 bytes from RAM into PPU's sprite memory
        if(write){
          for(b = 0; b < 256; ++b){
            WB(0x2004, RB((v & 7) * 0x0100 + b));
            return 0;
          }
        }
      
      // If accessing CPU memory at 0x4015 then reads will return the currentAPU status (APU_Read) or writes will affect the channels (APU_Writeline)
      case 0x15:
        if(!write){
          return APU_Read();
        }
        
        APU_Write(0x15, v);
        break;
      
      // If accessing CPU memory at 0x4016 then reads will get the last state of the Player 1 controller (IO_JoyRead on line 103),
      // while writes will strobe both players if v is positive (See IO_JoyStrobe)
      case 0x16:
        if(!write){
          return IO_JoyRead(0); 
        }
        IO_JoyStrobe(v);
        break;
        
      // If accessing CPU memory at 0x4017 then reads will read the state of the Player 2 controller (IO_JoyRead). Writes do nothing.
      case 0x17:
        if(!write){
          return IO_JoyRead(1); // write:passthru
        }
      
      // All other cases between 0x4000 and 0x4018 are writes to various APU component registers such as pulse, triangle, noise, and delta modulation (See APU_Write).
      default:
        if(!write){
          break;
        }
        APU_Write(addr & 0x1F, v);
    }
  }
  
  // All memory accesses above 0x4018 must be read/writes to GamePak memory (PRG/CHR ROM via GamePak_Access)
  else {
    return GamePak_Access(addr, v, write);
  }
  
  // Unreachable
  return 0;
}

// CPU_RB reads a byte at a given address. This function is used during user program ops and wraps the MemAccess template.
RB = function(addr){
  return MemAccess(addr);
}

// CPU_WB writes the provided value to the given address, again by wrapping the MemAccess template function.
WB = function(addr, v){
  return MemAccess(addr, v);
}

// CPU registers

// Initialize the CPU Program Counter (PC) register to 0xC000. This is the beginning of the code segment (PRG ROM).
// 0x8000 could also be the beginning of PRG ROM with 0xC000 being the mirror. Advanced mappers may translate these addresses to other PRG ROM banks.
PC = 0xC000;

// Initialize the accumulator (A), Index X(X), Index Y(Y), and Stack Pointer registers to 0.
A = X = Y = S = 0;

// Processor Status (flags) register
P = {
  
  // direct access to the entire register
  raw: 0,
  
  // Bit 0: accessor to the Carry flag.
  // Functions like most CPU carry flags, by asserting after an operation that resulting in positive overflows from bit 7 or negative overflows from bit 0.
  // Carry ~= unsigned overflow
  C: 0,
  
  // Bit 1: accessor to the Zero flag. Assets when any operation results in a zero result
  Z: 0,
  
  // bit 2: accessor to the Interrupt flag. When asserted, NES won't respond to interrupts.
  I: 0,
  
  // bit 2: accessor to the Decimal mode flag. Unused on NES.
  D: 0,
  
  // bits 4,5 don't exist
  // bit 6: accessor to the Overflow flag. Asserts after an operation that resulting in overflows from bit 6 to bit 7. Overflow ~= signed positive overflow
  V: 0,
  
  // Bit 7: accessor to the Negative flag. A sign indicator for the last instruction result. 0 is positive, 1 is negative.
  N: 0
};

// CPU::wrap function ensures that only the lower byte changes within a multi-byte input address.
// Effectively, this confines input addresses within the same memory page (256-byte).
CPU_wrap = function(oldaddr, newaddr){
  return (oldaddr & 0xFF00) + u8(newaddr);
}

// CPU_Misfire is a wrapper for reading an address using the CPU_wrap protection above.
Misfire = function(old, addr){
  q = CPU_wrap(old, addr);
  if(q != addr){
    RB(q);
  }
}

// NOTE ON CPU STACK OPERATIONS
// This stack implementation is limited to one page of memory (256 bytes).
// While this technically means that it won't overflow, it behaves like a ring buffer and will smash itself after 256 open Pushes.
// The stack pointer always refers to the next uninitialized byte to be used.

// CPU_Pop implements the classic stack pop by using the stack pointer register as an offset in to the 2nd page of NES RAM (bytes 0x100-0x1FF).
// Pop increments the stack pointer to the last used byte and returns the value stored there. 
CPU_Pop = function(){
  return RB(0x100 | u8(++S));
}

// CPU_Push stores an input value at the byte pointed to by the stack pointer. It then decrements the stack pointer.
Push = function(v){
  WB(0x100 | u8(S--), v);
}

// Fetch op'th item from a bitstring encoded in a data-specific variant of base64, where each character transmits 8 bits of information rather than 6.
T = function(s, code){
  var o8 = op / 8,
  o8m = 1 << (op % 8),
  i = o8m & (s[o8] > 90
      ? (130 + " (),-089<>?BCFGHJLSVWZ[^hlmnxy|}"[s[o8] - 94])
      : (s[o8]-" (("[s[o8] / 39])); 
  if(i){
    eval(code);
  } 
}

// CPU_Ins executes the relevant procedures required for the input op code. 
// An important concept buried in here is the idea that CPU instructions aggregate very low level tasks, usually following the sequence: fetch, operate, store.
// Bisqwit decomposed the 256 CPU ops in to 56 tasks you see prefixed with t(). The key is that each t() line does NOT represent a CPU operation;
// instead, each CPU operation executes multiple t() functions based on bitfield matches in augmented BASE64. Tasks are ordered roughly the same as in an actual CPU pipeline.
CPU_Ins = function(op){

  // Note: op 0x100 means "NMI", 0x101 means "Reset", 0x102 means "IRQ". They are implemented as "BRK".
  
  // Sets up the default evaluation environment for Op exeuction. These are temporary variables to hold intermediate values.
  // addr = no initial address.
  // d = no address offset.
  // t = fully maskable operand.
  // c = null backup/offset operand.
  // pbits = 0x20 or 0x30.
  // pbits mask the flags (P) register during certain operations. The core issue is controlling the mask of bits 4 and 5 depending on interrupt op status.
  var addr = 0, d = 0, t = 0xFF, c = 0, sb = 0, pbits = op < 0x100 ? 0x30 : 0x20;
  

  // Define the opcode decoding matrix, which decides which micro-operations constitute any particular opcode.
  // Fetch op'th item from a bitstring encoded in a data-specific variant of base64, where each character transmits 8 bits of information rather than 6.
  // All implemented opcodes are cycle-accurate and memory-access-accurate. Unofficial opcodes are written in [...].
  // Decode address operand
  T("                                !", "addr = 0xFFFA") // Set address register to 0xFFFA. Used in NMI.
  T("                                *", "addr = 0xFFFC") // Set address register to 0xFFFC. Used by Reset
  T("!                               ,", "addr = 0xFFFE") // Set address register to 0xFFFE. Used by IRQs
  T("zy}z{y}zzy}zzy}zzy}zzy}zzy}zzy}z ", "addr = RB(PC++)") // Read next instruction in as an address
  T("2 yy2 yy2 yy2 yy2 XX2 XX2 yy2 yy ", "d = X") // Set address offset register to index register X
  T("  62  62  62  62  om  om  62  62 ", "d = Y") // Set address offset register to index register Y
  T("2 y 2 y 2 y 2 y 2 y 2 y 2 y 2 y  ", "addr=u8(addr + d); d=0; tick()") // Offset address in to the same page
  T(" y z!y z y z y z y z y z y z y z ", "addr=u8(addr); addr += 256 * RB(PC++)") // Read in a page and offset in to that page (absolute)
  T("3 6 2 6 2 6 286 2 6 2 6 2 6 2 6 /", "addr=RB(c = addr); addr += 256 * RB(wrap(c, c + 1))") // Read in a page and offset from that page (indirect)
  T("  *Z  *Z  *Z  *Z      6z  *Z  *Z ", "Misfire(addr, addr + d)") // Verify and correct address range across pages (absolute load)
  T("  4k  4k  4k  4k  6z      4k  4k ", "RB(wrap(addr, addr + d))") // Verify and correct address range across pages (absolute store)
  
  // Load source operand 
  T("aa__ff__ab__,4  ____ -  ____     ", "t &= A") // Mask accumulator A on to temp operand t (store)
  T("                knnn     4  99   ", "t &= X") // Mask index register X on to temp operand t (store)
  T("                9989    99       ", "t &= Y") // Mask index register Y on to temp operand t (store) - sty,dey,iny,tya,cpy
  T("                       4         ", "t &= S") // Mask stack pointer register S on to temp operand t (store) - tsx, las
  T("!!!!  !!  !!  !!  !   !!  !!  !!/", "t &= P.raw | pbits; c = t") // Assert normally unused flags and backup temp operand - php, flag test/set/clear, interrupts
  T("_^__dc___^__            ed__98   ", "c = t; t = 0xFF") // Copy primary operand and reset it
  T("vuwvzywvvuwvvuwv    zy|zzywvzywv ", "t &= RB(addr + d)") // Mask indirectly stored byte in to temp operand
  T(",2  ,2  ,2  ,2  -2  -2  -2  -2   ", "t &= RB(PC++)") // Mask next instruction in to operand t (immediate)
  
  // Operations that mogrify memory operands directly 
  T("    88                           ", "P.V = t & 0x40; P.N = t & 0x80") // Set overflow and sign flags from the temp result t - bit
  T("    nink    nnnk                 ", "sb = P.C") // Store the result carry bit in temporary bit sb - rol,rla, ror,rra,arr
  T("nnnknnnk     0                   ", "P.C = t & 0x80") // Mask the result operand t in to the carry bit - rol,rla, asl,slo,[arr,anc]
  T("        nnnknink                 ", "P.C = t & 0x01") // Masks the least significant bit in to the carry bit - lsr,sre, ror,rra,asr
  T("ninknink                         ", "t = (t << 1) | (sb * 0x01)") // Left shifts temp operand and retains stored carry bit
  T("        nnnknnnk                 ", "t = (t >> 1) | (sb * 0x80)") // Right shifts temp operand and retains stored carry bit
  T("                 !      kink     ", "t = u8(t - 1)") // Decrement temporary operand - dec,dex,dey,dcp
  T("                         !  khnk ", "t = u8(t + 1)") // Increment temporary operand - inc,inx,iny,isb
  
  // Store modified value (memory) 
  T("kgnkkgnkkgnkkgnkzy|J    kgnkkgnk ", "WB(addr + d, t)") // Write the temporary operand to memory (indirect)
  T("                   q             ", "WB(wrap(addr, addr+d), t &= ((addr + d) >> 8))") // Write temporary operand to memory across pages, like a 'Far' memory operation without actual segmentation - [shx,shy,shs,sha?]
  
  // Some operations used up one clock cycle that we did not account for yet 
  T("rpstljstqjstrjst - - - -kjstkjst/", "tick()") // Skip a cycle (NOP) - nop,flag ops,inc,dec,shifts,stack,transregister,interrupts
  
  // Stack operations and unconditional jumps 
  T("     !  !    !                   ", "tick(); t = Pop()") // Pop value from the stack with NOP delay - pla,plp,rti
  T("        !   !                    ", "RB(PC++); PC = Pop(); PC |= (Pop() << 8)") // Pop two bytes from the stack into the 16-bit program counter. Similar to x86 RET - rti,rts
  T("            !                    ", "RB(PC++)") // Read (and discard) the next instruction - rts
  T("!   !                           /", "d=PC + (op ? -1 : 1); Push(d >> 8); Push(d)") // Set address offset forward or backward and pushes page and absolute address to the stack. Similar to x86 CALL - jsr, interrupts
  T("!   !    8   8                  /", "PC = addr") // Directly sets the program counter - jmp, jsr, interrupts
  T("!!       !                      /", "Push(t)") // Push temp operand t to the stack - pha, php, interrupts
  
  // Bitmasks 
  T("! !!  !!  !!  !!  !   !!  !!  !!/", "t = 1") // Set temporary operand t to 1
  T("  !   !                   !!  !! ", "t <<= 1") // Left shift temp operand t by 1 (doubles it)
  T("! !   !   !!  !!       !   !   !/", "t <<= 2") // Left shift temp operand t by 2 (x4)
  T("  !   !   !   !        !         ", "t <<= 4") // Left shifts temp operand t by 4 (x16)
  T("   !       !           !   !____ ", "t = u8(~t)") // Logically invert temp operand t - sbc, isb, clear flag
  T("`^__   !       !               !/", "t = c | t") // Store logical AND between temp and backup operands - ora, slo, set flag
  T("  !!dc`_  !!  !   !   !!  !!  !  ", "t = c & t") // Stores logical OR between temp and backup operands - and, bit, rla, clear/test flag
  T("        _^__                     ", "t = c ^ t") // Stores logical XOR between temp and backup operands - eor, sre
  
  // Conditional branches 
  T("      !       !       !       !  ", "if(t){ tick(); Misfire(PC, addr = s8(addr) + PC); PC = addr }") // Jump to a checked offset address based on t
  T("  !       !       !       !      ", "if(!t){ tick(); Misfire(PC, addr = s8(addr) + PC); PC = addr }") // Jumps to a checked offset address based on !t
    
  // Addition and subtraction 
  T("            _^__            ____ ", "c = t; t += A + P.C; P.V = (c ^ t) & (A ^ t) & 0x80; P.C = t & 0x100") // Save operand t and add (subtract) last A with Carry. Checks for overflow and recalculates carry.
  T("                        ed__98   ", "t = c - t; P.C = ~t & 0x100") // Compare t and c operands via subtraction (same means t == 0) Carry bit is set to inverse of t allowing the user to identify which operand is larger - cmp,cpx,cpy, dcp, sbx
  
  // Store modified value (register) 
  T("aa__aa__aa__ab__ 4 !____    ____ ", "A = t") // Set accumulator (A) to operand t result
  T("                    nnnn 4   !   ", "X = t") // Set index register (X) to operand t result - ldx, dex, tax, inx, tsx,lax,las,sbx
  T("                 !  9988 !       ", "Y = t") // Set index register (Y) to operand t result - ldy, dey, tay, iny
  T("                   4   0         ", "S = t") // Set stack pointer (S) to operand t result - txs, las, shs
  T("!  ! ! !!  !   !       !   !   !/", "P.raw = t & ~0x30") // Directly set the processor flags register ignoring the unused 4th and 5th bits - plp, rti, flag set/clear
  
  // Generic status flag updates 
  T("wwwvwwwvwwwvwxwv 5 !}}||{}wv{{wv ", "P.N = t & 0x80") // Update flags negative bit to match result sign bit
  T("wwwv||wvwwwvwxwv 5 !}}||{}wv{{wv ", "P.Z = u8(t) == 0") // Update flags for zero result
  T("             0                   ", "P.V = (((t >> 5)+1)&2)") // Update flags overflow bit by testing if incrementing 6th bit asserts 7th - [arr]
}

// CPU_Op is essentially the "game loop" of the emulator. It is called repeatedly until the emulator is closed/killed.
// It determines the next instruction (either interrupt or NES rom), and calls the appropriate function pointer.
CPU_Op = function(){

  // Update the current state of non-maskable interrupts
  nmi_now = nmi;
  
  // Read in the next operation based on the program counter. Iterate PC for the next cycle.
  op = RB(PC++);
  
  console.log(PC, op);

  // If reset is set, override the op code
  if(reset){
    op = 0x101;
  }
  
  // Overrides next op code if a non-maskable interrupt is detected. This is commonly associated with vertical blanking in the PPU.
  // If this the first nmi cycle, then nmi_edge_detected is set.
  else if(nmi_now && !nmi_edge_detected){
    op = 0x100;
    nmi_edge_detected = true;
  }
  
  // Regular interrupts also override the op code
  else if(intr && !P.I){
    op = 0x102;
  }
  
  // If no NMI is active unset the nmi_edge flag
  if(!nmi_now){
    nmi_edge_detected = false;
  }
  
  // Call the function pointed to by 'op' from the function table constructed above.
  //CPU_Ins[op]();
  
  CPU_Ins(op);
  
  // Unset the reset flag in preparation for the next cycle. There is currently no way for reset to be asserted after the first cycle. Normally the physical NES reset button would trigger this. Now, CPU is initialized with reset asserted.
  reset = false;
}