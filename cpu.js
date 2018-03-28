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
  
  // Internal RAM
  var html = "";
  for(i = CPU.S - 1; i < CPU.S + 4; i++){
    html += `<div id=cpu_byte_${i}>${tools.format4(i)}: 00</div>`;
  }
  internal_ram_info.innerHTML = html;
  
  // IO
  var html = "";
  for(i = 0x2000; i < 0x2005; i++){
    html += `<div id=cpu_byte_${i}>${tools.format4(i)}: 00</div>`;
  }

  io_info.innerHTML = html;
  
  // PRG-RAM
  var html = "";
  for(i = 0x6000; i < 0x6005; i++){
    html += `<div id=cpu_byte_${i}>${tools.format4(i)}: 00</div>`;
  }
  
  prg_ram_info.innerHTML = html;

  // PRG-ROM low page
    var html = "";
    var asm = "";
    var formatted_asm = "";
    var bytes_read = 0;
    
    // No including PC
    if(CPU.PC > 0xC000){
      for(i = 0x8000; i < 0x800A; i++){
        html += `<div id=cpu_byte_${i}>${tools.format4(i)}: ${tools.format2(CPU.read(i))}</div>`;
      }
    }
    
    // Including PC
    else {
      for(i = CPU.PC - 1; i < CPU.PC + 9; i++){
        
        // Opcode (add ASM code)
        if(bytes_read == 0 && i >= CPU.PC){
          formatted_asm = tools.format_asm(i);
          asm = formatted_asm[0];
          bytes_read = formatted_asm[1];
          html += `<div id=cpu_byte_${i}>${tools.format4(i)}: ${tools.format2(CPU.read(i))} ; ${asm}</div>`;
        }
        
        // Operand
        else {
          if(bytes_read > 0){
            bytes_read--;
          }
          html += `<div id=cpu_byte_${i}>${tools.format4(i)}: ${tools.format2(CPU.read(i))}</div>`;
        }
      }
    }
  
  prg_rom_low_page_info.innerHTML = html;
  
  // PRG-ROM high page
    html = "";
    asm = "";
    formatted_asm = "";
    bytes_read = 0;
    
    // Not including PC
    if(CPU.PC < 0xC000){
      for(i = 0xC000; i < 0xC00A; i++){
        html += `<div id=cpu_byte_${i}>${tools.format4(i)}: ${tools.format2(CPU.read(i))}</div>`;
      }
    }
    
    // Including PC
    else {
      for(i = CPU.PC - 1; i < CPU.PC + 9; i++){
        
        // Opcode (add ASM code)
        if(bytes_read == 0 && i >= CPU.PC){
          formatted_asm = tools.format_asm(i);
          asm = formatted_asm[0];
          bytes_read = formatted_asm[1];
          html += `<div id=cpu_byte_${i}>${tools.format4(i)}: ${tools.format2(CPU.read(i))} ; ${asm}</div>`;
        }
        
        // Operand
        else {
          if(bytes_read > 0){
            bytes_read--;
          }
          html += `<div id=cpu_byte_${i}>${tools.format4(i)}: ${tools.format2(CPU.read(i))}</div>`;
        }
      }
    }

  prg_rom_high_page_info.innerHTML = html;
  
  var formatted_asm = tools.format_asm(CPU.PC);
  var asm = formatted_asm[0];
  var bytes_read = formatted_asm[1];
  //window[`cpu_byte_${CPU.PC}`].innerHTML += ` ; ${asm}`;
  
  
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

  // Focus on stack pointer in internal RAM
  tools.focus("cpu_byte_" + CPU.S);
  
  // Focus on first instruction in PRG_ROM (PC = reset vector)
  tools.focus("cpu_byte_" + CPU.PC);
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
    
    // $2000-$3FFF: PPU I/O & mirrors
    else if(address < 0x4000){
      address = ((address - 0x2000) % 8) + 0x2000;
    }
    
    // Write
    if(write){
      CPU.memory[address] = value;
    }
    
    // Read
    else {
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
        Mapper.write(address, value);
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
        Mapper.write(address, value);
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
// If the byte is written on a read-only address, the memory isn't changed but the mapper is notified.
CPU.write = function(address, value){
  CPU.read_write(address, 0, value);
}

// Execute an opcode
// Update UI and cycles counters
CPU.op = function(){
  
  var opcode = CPU.read(CPU.PC);
  var extra_bytes = 0;
  
  switch(opcode){
    
    // SEI
    // I = 1
    // Set interrupt disable flag.
    case 0x78:
      CPU.I = 1;
      CPU.P = CPU.P | 0b100;
      i_info.innerHTML = CPU.I;
      p_info.innerHTML = tools.format2(CPU.P);
      CPU.cycles += 2;
      extra_bytes = 0;
      break;
  }
  
  cpu_cycles_info.innerHTML = tools.format4(CPU.cycles);
  CPU.PC = CPU.PC + extra_bytes + 1;
  pc_info.innerHTML = tools.format4(CPU.PC);
  tools.focus("cpu_byte_" + CPU.PC);
  
}