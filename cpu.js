// Namespace
CPU = {
  
  // Opcodes list
  opcodes: [
    "BRK",     "ORA (d,X)", "STP",    "SLO (d,X)", "NOP d",   "ORA d",   "ASL d",   "SLO d",   "PHP", "ORA #i",  "ASL", "ANC #i",  "NOP a",   "ORA a",   "ASL a",   "SLO a",
    "BPL *+d", "ORA (d),Y", "STP",    "SLO (d),Y", "NOP d,X", "ORA d,X", "ASL d,X", "SLO d,X", "CLC", "ORA a,Y", "NOP", "SLO a,Y", "NOP a,X", "ORA a,X", "ASL a,X", "SLO a,X",
    "JSR a",   "AND (d,X)", "STP",    "RLA (d,X)", "BIT d",   "AND d",   "ROL d",   "RLA d",   "PLP", "AND #i",  "ROL", "ANC #i",  "BIT a",   "AND a",   "ROL a",   "RLA a",
    "BMI *+d", "AND (d),Y", "STP",    "RLA (d),Y", "NOP d,X", "AND d,X", "ROL d,X", "RLA d,X", "SEC", "AND a,Y", "NOP", "RLA a,Y", "NOP a,X", "AND a,X", "ROL a,X", "RLA a,X",
    "RTI",     "EOR (d,X)", "STP",    "SRE (d,X)", "NOP d",   "EOR d",   "LSR d",   "SRE d",   "PHA", "EOR #i",  "LSR", "ALR #i",  "JMP a",   "EOR a",   "LSR a",   "SRE a",
    "BVC *+d", "EOR (d),Y", "STP",    "SRE (d),Y", "NOP d,X", "EOR d,X", "LSR d,X", "SRE d,X", "CLI", "EOR a,Y", "NOP", "SRE a,Y", "NOP a,X", "EOR a,X", "LSR a,X", "SRE a,X",
    "RTS",     "ADC (d,X)", "STP",    "RRA (d,X)", "NOP d",   "ADC d",   "ROR d",   "RRA d",   "PLA", "ADC #i",  "ROR", "ARR #i",  "JMP (a)", "ADC a",   "ROR a",   "RRA a",
    "BVS *+d", "ADC (d),Y", "STP",    "RRA (d),Y", "NOP d,X", "ADC d,X", "ROR d,X", "RRA d,X", "SEI", "ADC a,Y", "NOP", "RRA a,Y", "NOP a,X", "ADC a,X", "ROR a,X", "RRA a,X",
    "NOP #i",  "STA (d,X)", "NOP #i", "SAX (d,X)", "STY d",   "STA d",   "STX d",   "SAX d",   "DEY", "NOP #i",  "TXA", "XAA #i",  "STY a",   "STA a",   "STX a",   "SAX a",
    "BCC *+d", "STA (d),Y", "STP",    "AHX (d),Y", "STY d,X", "STA d,X", "STX d,Y", "SAX d,Y", "TYA", "STA a,Y", "TXS", "TAS a,Y", "SHY a,X", "STA a,X", "SHX a,Y", "AHX a,Y",
    "LDY #i",  "LDA (d,X)", "LDX #i", "LAX (d,X)", "LDY d",   "LDA d",   "LDX d",   "LAX d",   "TAY", "LDA #i",  "TAX", "LAX #i",  "LDY a",   "LDA a",   "LDX a",   "LAX a",
    "BCS *+d", "LDA (d),Y", "STP",    "LAX (d),Y", "LDY d,X", "LDA d,X", "LDX d,Y", "LAX d,Y", "CLV", "LDA a,Y", "TSX", "LAS a,Y", "LDY a,X", "LDA a,X", "LDX a,Y", "LAX a,Y",
    "CPY #i",  "CMP (d,X)", "NOP #i", "DCP (d,X)", "CPY d",   "CMP d",   "DEC d",   "DCP d",   "INY", "CMP #i",  "DEX", "AXS #i",  "CPY a",   "CMP a",   "DEC a",   "DCP a",
    "BNE *+d", "CMP (d),Y", "STP",    "DCP (d),Y", "NOP d,X", "CMP d,X", "DEC d,X", "DCP d,X", "CLD", "CMP a,Y", "NOP", "DCP a,Y", "NOP a,X", "CMP a,X", "DEC a,X", "DCP a,X",
    "CPX #i",  "SBC (d,X)", "NOP #i", "ISC (d,X)", "CPX d",   "SBC d",   "INC d",   "ISC d",   "INX", "SBC #i",  "NOP", "SBC #i",  "CPX a",   "SBC a",   "INC a",   "ISC a",
    "BEQ *+d", "SBC (d),Y", "STP",    "ISC (d),Y", "NOP d,X", "SBC d,X", "INC d,X", "ISC d,X", "SED", "SBC a,Y", "NOP", "ISC a,Y", "NOP a,X", "SBC a,X", "INC a,X", "ISC a,X",
  ],
  
  // Memory
  memory_buffer: null,
  memory_signed: null,
  memory: null,
  
  // Pointers
  nmi_vector: 0,
  reset_vector: 0,
  irq_vector: 0,
  
  // Registers
  A: 0,
  X: 0,
  Y: 0,
  PC: 0,
  S: 0,
  P: 0,

  // Flags
  C: 0,
  Z: 0,
  I: 0,
  D: 0,
  B: 0,
  V: 0,
  N: 0,
  
  // Cycles
  cycles: 0,
  
  // Loop
  loop:  null,
  
};

// Methods

// Init CPU memory, flags, UI
CPU.init = function(){
  
  // CPU memory + 2 views (signed int / unsigned int)
  // (Only the first 32KB of the memory is initialized, the rest will be accessible through the PRG-ROM banks)
  CPU.memory_buffer = new ArrayBuffer(32 * 1024);
  CPU.memory_signed = new Int8Array(CPU.memory_buffer);
  CPU.memory = new Uint8Array(CPU.memory_buffer);

  // Interrupt vectors:
  
    // NMI vector ($FFFA-$FFFB, big-endian)
    CPU.nmi_vector = (CPU.read(0xFFFB) << 8) + CPU.read(0xFFFA);
    
    // Reset vector, also used when the system starts ($FFFC-$FFFD, big-endian)
    CPU.reset_vector = (CPU.read(0xFFFD) << 8) + CPU.read(0xFFFC);
    
    // IRQ/BRK vector ($FFFE-$FFFF, big-endian)
    CPU.irq_vector = (CPU.read(0xFFFF) << 8) + CPU.read(0xFFFE);
    
  // Registers:
  
    // Accumulator
    CPU.A = 0;
    
    // Index Registers
    CPU.X = 0;
    CPU.Y = 0;
    
    // Program Counter (points to the address in the reset vector)
    CPU.PC = CPU.reset_vector;
    
    // Stack pointer
    CPU.S = 0xFD;
    
    // Processor Status Register (Flags) - bit 5 is always 1.
    CPU.P = 0x34;
    
  // Flags (bits of P):
  
    // Carry (bit 0)
    CPU.C = 0;
    
    // Zero (bit 1)
    CPU.Z = 0;
    
    // IRQ disable (bit 2)
    // This bit is set on boot
    CPU.I = 1;
    
    // Decimal mode (bit 3)
    CPU.D = 0;
    
    // Break Flag (0 = IRQ/NMI, 1 = RESET/BRK/PHP) (bit 5)
    // This bit is set on boot
    CPU.B = 1;
    
    // Overflow (bit 6)
    CPU.V = 0;
    
    // Negative (bit 7)
    CPU.N = 0;
    
  // UI
  
  // TODO: update PRG-ROM bank numbers on bankswitch
  
  CPU.draw_internal_ram(CPU.S);
  CPU.draw_prg_ram();
  CPU.draw_prg_rom_low_page(CPU.PC);
  CPU.draw_prg_rom_high_page(CPU.PC);
  
  
  // UI
  nmi_vector_info.innerHTML = "$" + tools.format4(CPU.nmi_vector);
  reset_vector_info.innerHTML = "$" + tools.format4(CPU.reset_vector);
  irq_vectort_info.innerHTML = "$" + tools.format4(CPU.irq_vector);

  a_info.innerHTML = tools.format2(CPU.A);
  x_info.innerHTML = tools.format2(CPU.X);
  y_info.innerHTML = tools.format2(CPU.Y);
  pc_info.innerHTML = tools.format4(CPU.PC);
  s_info.innerHTML = tools.format2(CPU.S);
  p_info.innerHTML = tools.format2(CPU.P)
  
  c_info.innerHTML = CPU.C;
  z_info.innerHTML = CPU.Z;
  i_info.innerHTML = CPU.I;
  d_info.innerHTML = CPU.D;
  b_info.innerHTML = CPU.B;
  v_info.innerHTML = CPU.V;
  n_info.innerHTML = CPU.N;
};

// Read/write a byte in CPU memory
CPU.read_write = function(address, signed, value){
  
  // Write
  var write = typeof value !== "undefined";
  
  // CPU memory
  if(address < 0x4020){
    
    // $0000-$1fff: internal RAM & mirrors
    if(address < 0x2000){
      address %= 0x800;
    }
    
    // $2000-$3FFF: I/O & mirrors
    else if(address < 0x4000){
      address = ((address - 0x2000) % 8) + 0x2000;

      // Focus
      tools.focus("cpu_byte_" + address);
    }
    
    
    // Write
    if(write){
      CPU.memory[address] = value;
      
      // Focus
      // Internal RAM
      if(address < 0x2000){
        CPU.draw_internal_ram(address);
      }
      
      // I/O
      else {
        window["cpu_byte_" + address].innerHTML = tools.format2(value);  
      }
    }
    
    // Read
    else {
      
      // Clear bit 7 of $2002 on read
      if(address == 0x2002){
        value = CPU.memory[address];
        CPU.write(0x2002, value & 0b01111111);
        return value;
      }
      
      return CPU.memory[address];
    }
  }
  
  // Cartridge space
  else {
    
    // $4020-$5FFF: expansion ROM
    // TODO: bankswitch
    // Default: bank 0
    if(address < 0x6000){
      
      // Read-only
      if(!write){
        
        if(signed){
          return gamepak.extra_ROM_signed[0][address - 0x6000];
        }
        else {
          return gamepak.extra_ROM[0][address - 0x6000];
        }
      }
    }
    
    // $7000-$71FF: trainer
    else if(CPU.trainer_bank && address >= 0x7000 && address < 0x7200){
      
      // Read-only
      if(!write){
        
        if(signed){
          return gamepak.trainer_signed[address - 0x7000];
        }
        else {
          return gamepak.trainer[address - 0x7000];
        }
      }
      
    }
    
    // $6000-$7FFF: PRG-RAM
    else if(address < 0x8000){
      
    }
    
    // $8000-$BFFF: PRG-ROM, low page
    // TODO: bankswitch.
    // Default: bank 0
    
    else if(address < 0xC000){
      
      // Write (nothing is written in ROM but the mapper is notified)
      if(write){
        //Mapper.write(address, value);
      }
      
      // Read
      else {
        
        // Signed
        if(signed){
          return gamepak.PRG_ROM_signed[0][address - 0x8000];
        }

        // Unsigned
        else {
          return gamepak.PRG_ROM[0][address - 0x8000];
        }
      }
    }
    
    // $C000-$FFFF: PRG-ROM, high page
    // TODO: bankswitch.
    // Default: bank 1
    else {
      
      // Write (nothing is written in ROM but the mapper is notified)
      if(write){
        //Mapper.write(address, value);
      }
      
      // Read
      else {
        
        // Signed
        if(signed){
          return gamepak.PRG_ROM_signed[1][address - 0xC000];
        }

        // Unsigned
        else {
          return gamepak.PRG_ROM[1][address - 0xC000];
        }
      }
    }
  }
}

// Read a byte from CPU memory
CPU.read = function(address, signed = 0){
  return CPU.read_write(address, signed);
}

// Write a byte in CPU memory
// If the byte is written on a read-only address, the memory isn't changed, but the mapper is notified.
CPU.write = function(address, value){
  CPU.read_write(address, 0, value);
}

// Execute an opcode
// Update UI and cycles counters
CPU.op = function(){
  
  var opcode = CPU.read(CPU.PC);
  var operand = 0;
  var tmp;
  var M = 0;
  var extra_bytes = 0;
  var branch = 0;
  var cycles = 0;
  
  // The byte at address [PC] defines the current opcode (among 56 different ones) and its addressing mode (among 12 different ones)
  
  // Addressing mode
  switch(opcode){
    
    // #i
    // Immediate
    case 0x9:
    case 0xb:
    case 0x29:
    case 0x2b:
    case 0x49:
    case 0x4b:
    case 0x69:
    case 0x6b:
    case 0x80:
    case 0x82:
    case 0x89:
    case 0x8b:
    case 0xa0:
    case 0xa2:
    case 0xa9:
    case 0xab:
    case 0xc0:
    case 0xc2:
    case 0xc9:
    case 0xcb:
    case 0xe0:
    case 0xe2:
    case 0xe9:
    case 0xeb:
      
      // Operand address: PC + 1
      operand = CPU.PC + 1;
      
      // 2 CPU cycles
      cycles += 2;
      
      // 1 extra byte is read
      extra_bytes = 1;
      
    break;
    
    // d
    // Zero page
    case 0x04:
    case 0x05:
    case 0x06:
    case 0x07:
    case 0x24:
    case 0x25:
    case 0x26:
    case 0x27:
    case 0x44:
    case 0x45:
    case 0x46:
    case 0x47:
    case 0x64:
    case 0x65:
    case 0x66:
    case 0x67:
    case 0x84:
    case 0x85:
    case 0x86:
    case 0x87:
    case 0xa4:
    case 0xa5:
    case 0xa6:
    case 0xa7:
    case 0xc4:
    case 0xc5:
    case 0xc6:
    case 0xc7:
    case 0xe4:
    case 0xe5:
    case 0xe6:
    case 0xe7:
    
      // Operand address: memory[PC + 1]
      operand = CPU.read(CPU.PC + 1);
      
      // 2 CPU cycles
      cycles += 2;
      
      // 1 extra byte is read
      extra_bytes = 1;
    
    break;
    
    // *+d
    // Relative
    case 0x10:
    case 0x30:
    case 0x50:
    case 0x70:
    case 0x90:
    case 0xb0:
    case 0xd0:
    case 0xf0:
    
      // Operand address: PC + 2 + signed(memory[PC + 1])
      operand = CPU.PC + 2 + CPU.read(CPU.PC + 1, 1);
      
      // 2* CPU cycles
      // TODO: 1 extra cycle is used if the branch succeeds and 2 extra cycles are used if the branch goes to a new page
      cycles += 2;
      
      // 1 extra byte is read
      extra_bytes = 1;
    
    break;
    
    // a
    // Absolute
    case 0x0c:
    case 0x0d:
    case 0x0e:
    case 0x0f:
    case 0x20:
    case 0x2c:
    case 0x2d:
    case 0x2e:
    case 0x2f:
    case 0x4c:
    case 0x4d:
    case 0x4e:
    case 0x4f:
    case 0x6d:
    case 0x6e:
    case 0x6f:
    case 0x8c:
    case 0x8d:
    case 0x8e:
    case 0x8f:
    case 0xac:
    case 0xad:
    case 0xae:
    case 0xaf:
    case 0xcc:
    case 0xcd:
    case 0xce:
    case 0xcf:
    case 0xec:
    case 0xed:
    case 0xee:
    case 0xef:
    
      // Operand: (memory[PC + 2] << 8) + memory[PC + 1]
      operand = (CPU.read(CPU.PC + 2) << 8) + CPU.read(CPU.PC + 1);
      
      // 3-6 CPU cycles
      // TODO: figure out why 3-6, 6502.js says 4
      cycles += 4;
      
      // 2 extra bytes are read
      extra_bytes = 2;
    
    break;
    
    // (a)
    // Indirect
    case 0x6c:
      
      // Absolute address: a = (memory[PC + 2] << 8) + memory[PC + 1]
      // Operand address: (memory[a + 1] << 8) + memory[a]
      var a = (CPU.read(CPU.PC + 2) << 8) + CPU.read(CPU.PC + 1);
      operand = (CPU.read(a + 1) << 8) + CPU.read(a);
      
      // 5 CPU cycles
      cycles += 5;
      
      // 2 extra bytes are read
      extra_bytes = 2;
      
    break;
    
    // d,X
    // Zero page indexed
    case 0x14:
    case 0x15:
    case 0x16:
    case 0x17:
    case 0x34:
    case 0x35:
    case 0x36:
    case 0x37:
    case 0x54:
    case 0x55:
    case 0x56:
    case 0x57:
    case 0x74:
    case 0x75:
    case 0x76:
    case 0x77:
    case 0x94:
    case 0x95:
    case 0xb4:
    case 0xb5:
    case 0xd4:
    case 0xd5:
    case 0xd6:
    case 0xd7:
    case 0xf4:
    case 0xf5:
    case 0xf6:
    case 0xf7:
    
      // Operand address: (memory[PC + 1] + X) % 256
      operand = (CPU.read(CPU.PC + 1) + CPU.X) % 256;
      
      // 4-6 CPU cycles
      // TODO cycles
      cycles += 0;
      
      // 1 extra byte is read
      extra_bytes = 1;
    
    break;
    
    // d,Y
    // Zero page indexed
    case 0x96:
    case 0x97:
    case 0xb6:
    case 0xb7:
    
      // Operand address: (memory[PC + 1] + Y) % 256
      operand = (CPU.read(CPU.PC + 1) + CPU.Y) % 256;
      
      // 4 CPU cycles
      cycles += 4;
      
      // 1 extra byte is read
      extra_bytes = 1;
    
    break;
    
    // a,X
    // Absolute indexed
    case 0x1c:
    case 0x1d:
    case 0x1e:
    case 0x1f:
    case 0x3c:
    case 0x3d:
    case 0x3e:
    case 0x3f:
    case 0x5c:
    case 0x5d:
    case 0x5e:
    case 0x5f:
    case 0x7c:
    case 0x7d:
    case 0x7e:
    case 0x7f:
    case 0x9c:
    case 0x9d:
    case 0xbc:
    case 0xbd:
    case 0xdc:
    case 0xdd:
    case 0xde:
    case 0xdf:
    case 0xfc:
    case 0xfd:
    case 0xfe:
    case 0xff:
    
      // Absolute address: a = (memory[PC + 2] << 8) + memory[PC + 1]
      // Operand address: a + X 
      var a = (CPU.read(CPU.PC + 2) << 8) + CPU.read(CPU.PC + 1);
      operand = a + CPU.X;
      
      // 4-7 CPU cycles
      // TODO
      cycles += 0;
      
      // 2 extra bytes are read
      extra_bytes = 2;
    
    break;
    
    // a,Y
    // Absolute indexed
    case 0x19:
    case 0x1b:
    case 0x39:
    case 0x3b:
    case 0x59:
    case 0x5b:
    case 0x79:
    case 0x7b:
    case 0x99:
    case 0x9b:
    case 0x9e:
    case 0x9f:
    case 0xb9:
    case 0xbb:
    case 0xbe:
    case 0xbf:
    case 0xd9:
    case 0xdb:
    case 0xf9:
    case 0xfb:
    
      // Absolute address: a = (memory[PC + 2] << 8) + memory[PC + 1]
      // Operand address: a + Y 
      var a = (CPU.read(CPU.PC + 2) << 8) + CPU.read(CPU.PC + 1);
      operand = a + CPU.Y;
      
      // 4-5 CPU cycles
      // TODO
      cycles += 0;
      
      // 2 extra bytes are read
      extra_bytes = 2;
    
    break;
    
    // (d,X)
    // Indexed indirect
    case 0x01:
    case 0x03:
    case 0x21:
    case 0x23:
    case 0x41:
    case 0x43:
    case 0x61:
    case 0x63:
    case 0x81:
    case 0x83:
    case 0xa1:
    case 0xa3:
    case 0xc1:
    case 0xc3:
    case 0xe1:
    case 0xe3:
    
      // Zero page index: d = memory[PC + 1]
      // Operand address: (memory[(d + X + 1) % 256] << 8) + memory[(d + X) % 256]
      var d = CPU.read(CPU.PC + 1);
      operand = (CPU.read((d + CPU.X + 1) % 256) << 8) + CPU.read((d + CPU.X) % 256);
      
      // 6 CPU cycles
      cycles += 6;
      
      // 1 extra byte is read
      extra_bytes = 1;
    
    break;
    
    // (d),Y
    // Indirect indexed
    case 0x11:
    case 0x13:
    case 0x31:
    case 0x33:
    case 0x51:
    case 0x53:
    case 0x71:
    case 0x73:
    case 0x91:
    case 0x93:
    case 0xb1:
    case 0xb3:
    case 0xd1:
    case 0xd3:
    case 0xf1:
    case 0xf3:
    
      // Zero page index: d = memory[PC + 1]
      // Operand: (memory[(d + 1) % 256] << 8) + memory[d] + Y
      var d = CPU.read(CPU.PC + 1);
      operand = (CPU.read((d + 1) % 256) << 8) + CPU.read(d) + CPU.Y;
      
      // 5-6 CPU cycles
      // TODO
      cycles += 0;
      
      // 1 extra byte is read
      extra_bytes = 1;
    
    break;
    
    // Implicit ($00, $40, $60, $02, $12, $22, $32, $42, $52, $62, $72, $92, $B2, $C2, $F2, $x8, $xA)
    default:
      
      // 2 CPU cycles
      cycles += 2;
    
    break;
  }
  
  
  
  
  if(debug)console.log("operand: 0x" + operand.toString(16))
  
  
  
  
  
  // Opcode
  switch(opcode){

    // AND
    // A,Z,N = A&M
    // Store in A the result of of M AND A. Z: set if A = 0. N: set if bit 7 of result is set.
    case 0x21: // AND (d,X)
    case 0x25: // AND d
    case 0x29: // AND #i
    case 0x2d: // AND a
    case 0x31: // AND (d),Y
    case 0x35: // AND d,X
    case 0x39: // AND a,Y
    case 0x3d: // AND a,X
      CPU.A = operand & CPU.A;
      CPU.set_z(CPU.A);
      CPU.set_n_if_bit_7(CPU.A);
      break;
      
    // BEQ
    // Branch to relative address (PC += rel) if Z = 1. rel is signed.
    case 0xf0: // BEQ *+d
      if(CPU.Z == 1){
        CPU.PC = operand;
        branch = 1;
      }
      break;
      
    // BNE
    // Branch to relative address (PC += rel) if Z = 0.
    case 0xd0: // BNE *+d
      if(CPU.Z == 0){
        CPU.PC = operand;
        branch = 1;
      }
      break;
      
    // BPL
    // Branch to relative address (PC += rel) if N = 0.
    case 0x10: // BPL *+d
      if(CPU.N == 0){
        CPU.PC = operand;
        branch = 1;
      }
      break;
    
    // CLD
    // D = 0
    // Clear decimal flag
    case 0xD8:
      CPU.clear_d();
      break;
      
    // DEC
    // M,Z,N = M-1
    // Decrement M. Z: result = 0. N: set if bit 7 of result is set.
    // (M = (M - 1) & 0xFF)
    case 0xc6: // DEC d
    case 0xce: // DEC a
    case 0xd6: // DEC d,X
    case 0xde: // DEC a,X
      var value = (CPU.read(operand) - 1) & 0xFF;
      CPU.write(operand, value);
      CPU.set_z(value);
      CPU.set_n_if_bit_7(value);
      break;
    
    // DEY
    // M,Z,N = Y - 1
    // Decrement Y. Z: result = 0. N: set if bit 7 of result is set.
    // (Y = (Y - 1) & 0xFF)
    case 0x88: // DEY
      CPU.Y = (CPU.Y - 1) & 0xFF;
      y_info.innerHTML = tools.format2(CPU.Y);
      CPU.set_z(CPU.Y);
      CPU.set_n_if_bit_7(CPU.Y);
      break;
    
    // LDA
    // A,Z,N = M
    // Load M in A. Z: set if A = 0. N: bit 7 of A
    case 0xa1: // LDA (d,X)
    case 0xa5: // LDA d
    case 0xa9: // LDA #i
    case 0xad: // LDA a
    case 0xb1: // LDA (d),Y
    case 0xb5: // LDA d,X
    case 0xb9: // LDA a,Y
    case 0xbd: // LDA a,X
      //console.log(operand.toString(16));
      //console.log(CPU.read(operand));
      CPU.A = CPU.read(operand);
      //console.log(CPU.A);
      //console.log(tools.format2(CPU.A));
      a_info.innerHTML = tools.format2(CPU.A);
      CPU.set_z(CPU.A);
      CPU.set_n(CPU.A);
      break;
      
    // LDX
    // X,Z,N = M
    // Load M in X. Z: set if X = 0. N: bit 7 of X
    case 0xa2: // LDX #i
    case 0xa6: // LDX d
    case 0xae: // LDX a
    case 0xb6: // LDX d,Y
    case 0xbe: // LDX a,Y
      CPU.X = CPU.read(operand);
      x_info.innerHTML = tools.format2(CPU.X);
      CPU.set_z(CPU.X);
      CPU.set_n(CPU.X);
      break;
      
    // LDY
    // Y,Z,N = M
    // Load M in Y. Z: set if Y = 0. N: bit 7 of Y
    case 0xa0: // LDY #i
    case 0xa4: // LDY d
    case 0xac: // LDY a
    case 0xb4: // LDY d,X
    case 0xbc: // LDY a,X
      CPU.Y = CPU.read(operand);
      y_info.innerHTML = tools.format2(CPU.Y);
      CPU.set_z(CPU.Y);
      CPU.set_n(CPU.Y);
      break;
    
    // SEI
    // I = 1
    // Set interrupt disable flag
    case 0x78:
      CPU.set_i();
      break;

    // STA
    // M = A
    // Store A in M
    case 0x81: // STA (d,X)
    case 0x85: // STA d
    case 0x8d: // STA a
    case 0x91: // STA (d),Y
    case 0x95: // STA d,X
    case 0x99: // STA a,Y
    case 0x9d: // STA a,X
      CPU.write(operand, CPU.A);
      break;
      
    // STY
    // M = Y
    // Store Y in M
    case 0x84: // STY d
    case 0x8c: // STY a
    case 0x94: // STY d,X
      console.log(operand);
      CPU.write(operand, CPU.Y);
      break;
      
    // TXS
    // S = X
    // Copy X in S
    case 0x9A:
      CPU.S = CPU.X;
      s_info.innerHTML = tools.format2(CPU.S);
      break;
  }
  
  // Update PC
  if(!branch){
    CPU.PC = CPU.PC + extra_bytes + 1;
  }
  
  // Ticks
  // The PPU and APU tick 3 times during each CPU tick
  CPU.cycles += cycles;
  for(var i = 0; i < cycles; i++){
    PPU.tick();
    PPU.tick();
    PPU.tick();
    /*
    APU.tick();
    APU.tick();
    APU.tick();
    */
  }
  
  // Update UI
  p_info.innerHTML = tools.format2(CPU.P);
  cpu_cycles_info.innerHTML = CPU.cycles;
  pc_info.innerHTML = tools.format4(CPU.PC);
  CPU.draw_prg_rom_low_page(CPU.PC);
  CPU.draw_prg_rom_high_page(CPU.PC);
}

// UI helpers

// PRG-ROM low page
CPU.draw_prg_rom_low_page = function(address){
  
  if(!debug) return;
  
  var html = "";
  
  // Default 
  if(typeof address === "undefined" || address < 0x8000 || address >= 0xC000){
    for(i = 0x8000; i < 0x800A; i++){
      html += `<div id=cpu_byte_${i}>${tools.format4(i)}: ${tools.format2(CPU.read(i))}</div>`;
    }
  }
  
  // Focus on one address
  else {
    var min = Math.max(0x8000, address - 5);
    for(i = min; i < min + 10; i++){
      if(i == address){
        html += (gamepak.asm[0][i - 0x8000] = gamepak.asm[0][i - 0x8000] || `<div id=cpu_byte_${i}>${tools.format4(i)}: ${tools.format2(CPU.read(i))}; ${tools.asm(i)}</div>`);
      }
      else {
        html += (gamepak.asm[0][i - 0x8000] || `<div id=cpu_byte_${i}>${tools.format4(i)}: ${tools.format2(CPU.read(i))}</div>`);
      }
    }
  }
  prg_rom_low_page_info.innerHTML = html;
  
  if(window["cpu_byte_" + address]){
    window["cpu_byte_" + address].classList.add("focus");
  }
}

// PRG-ROM high page
// TODO: bankswitch
CPU.draw_prg_rom_high_page = function(address){
  
  if(!debug) return;
  
  var html = "";
  
  // Default 
  if(typeof address === "undefined" || address < 0xC000){
    for(i = 0xC000; i < 0xC00A; i++){
      html += `<div id=cpu_byte_${i}>${tools.format4(i)}: ${tools.format2(CPU.read(i))}</div>`;
    }
  }
  
  // Focus on one address
  else {
    var min = Math.max(0xC000, address - 5);
    for(i = min; i < min + 10; i++){
      if(i == address){
        html += (gamepak.asm[1][i - 0xC000] = gamepak.asm[1][i - 0xC000] || `<div id=cpu_byte_${i}>${tools.format4(i)}: ${tools.format2(CPU.read(i))}; ${tools.asm(i)}</div>`);
      }
      else {
        html += (gamepak.asm[1][i - 0xC000] || `<div id=cpu_byte_${i}>${tools.format4(i)}: ${tools.format2(CPU.read(i))}</div>`);
      }
    }
  }
  prg_rom_high_page_info.innerHTML = html;
  
  if(window["cpu_byte_" + address]){
    window["cpu_byte_" + address].classList.add("focus");
  }
}

// Internal RAM
CPU.draw_internal_ram = function(address){

  if(!debug) return;
  
  var html = "";
  
  // Default 
  if(typeof address === "undefined"){
    for(i = 0x0000; i < 0x0004; i++){
      html += `<div id=cpu_byte_${i}>${tools.format4(i)}: ${tools.format2(CPU.read(i))}</div>`;
    }
  }
  
  // Focus on one address
  else {
    var min = Math.max(0x0000, address - 1);
    for(i = min; i < min + 5; i++){
      if(i == CPU.S){
        html += `<div class="focus S" id=cpu_byte_${i}>${tools.format4(i)}: ${tools.format2(CPU.read(i))}</div>`;
      }
      else if(i == address){
        html += `<div class="focus" id=cpu_byte_${i}>${tools.format4(i)}: ${tools.format2(CPU.read(i))}</div>`;
      }
      else {
        html += `<div id=cpu_byte_${i}>${tools.format4(i)}: ${tools.format2(CPU.read(i))}</div>`;
      }
    }
  }
  internal_ram_info.innerHTML = html;
}

// PRG-RAM
CPU.draw_prg_ram = function(address){
  
  var html = "";
  for(i = 0x6000; i < 0x6005; i++){
    html += `<div id=cpu_byte_${i}>${tools.format4(i)}: 00</div>`;
  }
  
  prg_ram_info.innerHTML = html;
}

// Opcode helpers
CPU.set_i = function(){
  
  // Set I
  CPU.I = 1;
  
  // Update P
  CPU.P = CPU.P | 0b100;
  
  // UI
  i_info.innerHTML = CPU.I;
}

CPU.clear_d = function(){
  
  // clear D
  CPU.D = 0;
  
  // Update P
  CPU.P = CPU.P & 0b11110111;
  
  // UI
  d_info.innerHTML = CPU.D;
}

CPU.set_z = function(value){
  
  // Test
  if(value === 0){
    
    // Set Z
    CPU.Z = 1;
    
    // Update P
    CPU.P = CPU.P | 0b00000010;
  }
  
  else {
    
    // Clear Z
    CPU.Z = 0;
    
    // Update P
    CPU.P = CPU.P & 0b11111101;
  }
  
  // UI
  z_info.innerHTML = CPU.Z;
}

CPU.set_n = function(value){
  
  // Set N
  CPU.N = CPU.A >> 7;
  
  // Update P
  if(CPU.N === 1){
    CPU.P = (CPU.P | 0b10000000);
  }
  else {
    CPU.P = (CPU.P & 0b01111111);
  }
  
  // UI
  n_info.innerHTML = CPU.N;
}

CPU.set_n_if_bit_7 = function(value){
  
  if((value >> 7) == 1){
    
    // Set N
    CPU.N = value >> 7;
  
    // Update P
    CPU.P = (CPU.P | 0b10000000);
  
    // UI
    n_info.innerHTML = CPU.N;
  }
}

// Play until PC reaches the value in the breakpoint input (if any)
CPU.play = function(){
  debug = false;
  var breakpoint_address = breakpoint.value ? parseInt(breakpoint.value, 16) : -1;
  //console.log(breakpoint_address);
  CPU.loop = setInterval(function(){
    for(var i = 0; i < 1000; i++){
      if(CPU.PC != breakpoint_address){
        CPU.op();
      }
      else {
        clearInterval(CPU.loop);
        debug = true;
        CPU.draw_prg_rom_low_page(CPU.PC);
        CPU.draw_prg_rom_high_page(CPU.PC);
        screen_x_info.innerHTML = PPU.x;
        screen_y_info.innerHTML = PPU.y;
        screen_canvas.width = screen_canvas.width; 
        PPU.screen_ctx.fillStyle = "red";
        PPU.screen_ctx.fillRect(PPU.x, PPU.y, 2, 2);
      }
    }
  },9)
}