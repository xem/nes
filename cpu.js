// Global
CPU = {};

// Opcodes list
CPU.opcodes = [
"BRK",
"ORA (d,x)",
"STP",
"SLO (d,x)",
"NOP d",
"ORA d",
"ASL d",
"SLO d",
"PHP",
"ORA #i",
"ASL",
"ANC #i",
"NOP a",
"ORA a",
"ASL a",
"SLO a",
"BPL *+d",
"ORA (d),y",
"STP",
"SLO (d),y",
"NOP d,x",
"ORA d,x",
"ASL d,x",
"SLO d,x",
"CLC",
"ORA a,y",
"NOP",
"SLO a,y",
"NOP a,x",
"ORA a,x",
"ASL a,x",
"SLO a,x",
"JSR a",
"AND (d,x)",
"STP",
"RLA (d,x)",
"BIT d",
"AND d",
"ROL d",
"RLA d",
"PLP",
"AND #i",
"ROL",
"ANC #i",
"BIT a",
"AND a",
"ROL a",
"RLA a",
"BMI *+d",
"AND (d),y",
"STP",
"RLA (d),y",
"NOP d,x",
"AND d,x",
"ROL d,x",
"RLA d,x",
"SEC",
"AND a,y",
"NOP",
"RLA a,y",
"NOP a,x",
"AND a,x",
"ROL a,x",
"RLA a,x",
"RTI",
"EOR (d,x)",
"STP",
"SRE (d,x)",
"NOP d",
"EOR d",
"LSR d",
"SRE d",
"PHA",
"EOR #i",
"LSR",
"ALR #i",
"JMP a",
"EOR a",
"LSR a",
"SRE a",
"BVC *+d",
"EOR (d),y",
"STP",
"SRE (d),y",
"NOP d,x",
"EOR d,x",
"LSR d,x",
"SRE d,x",
"CLI",
"EOR a,y",
"NOP",
"SRE a,y",
"NOP a,x",
"EOR a,x",
"LSR a,x",
"SRE a,x",
"RTS",
"ADC (d,x)",
"STP",
"RRA (d,x)",
"NOP d",
"ADC d",
"ROR d",
"RRA d",
"PLA",
"ADC #i",
"ROR",
"ARR #i",
"JMP (a)",
"ADC a",
"ROR a",
"RRA a",
"BVS *+d",
"ADC (d),y",
"STP",
"RRA (d),y",
"NOP d,x",
"ADC d,x",
"ROR d,x",
"RRA d,x",
"SEI",
"ADC a,y",
"NOP",
"RRA a,y",
"NOP a,x",
"ADC a,x",
"ROR a,x",
"RRA a,x",
"NOP #i",
"STA (d,x)",
"NOP #i",
"SAX (d,x)",
"STY d",
"STA d",
"STX d",
"SAX d",
"DEY",
"NOP #i",
"TXA",
"XAA #i",
"STY a",
"STA a",
"STX a",
"SAX a",
"BCC *+d",
"STA (d),y",
"STP",
"AHX (d),y",
"STY d,x",
"STA d,x",
"STX d,y",
"SAX d,y",
"TYA",
"STA a,y",
"TXS",
"TAS a,y",
"SHY a,x",
"STA a,x",
"SHX a,y",
"AHX a,y",
"LDY #i",
"LDA (d,x)",
"LDX #i",
"LAX (d,x)",
"LDY d",
"LDA d",
"LDX d",
"LAX d",
"TAY",
"LDA #i",
"TAX",
"LAX #i",
"LDY a",
"LDA a",
"LDX a",
"LAX a",
"BCS *+d",
"LDA (d),y",
"STP",
"LAX (d),y",
"LDY d,x",
"LDA d,x",
"LDX d,y",
"LAX d,y",
"CLV",
"LDA a,y",
"TSX",
"LAS a,y",
"LDY a,x",
"LDA a,x",
"LDX a,y",
"LAX a,y",
"CPY #i",
"CMP (d,x)",
"NOP #i",
"DCP (d,x)",
"CPY d",
"CMP d",
"DEC d",
"DCP d",
"INY",
"CMP #i",
"DEX",
"AXS #i",
"CPY a",
"CMP a",
"DEC a",
"DCP a",
"BNE *+d",
"CMP (d),y",
"STP",
"DCP (d),y",
"NOP d,x",
"CMP d,x",
"DEC d,x",
"DCP d,x",
"CLD",
"CMP a,y",
"NOP",
"DCP a,y",
"NOP a,x",
"CMP a,x",
"DEC a,x",
"DCP a,x",
"CPX #i",
"SBC (d,x)",
"NOP #i",
"ISC (d,x)",
"CPX d",
"SBC d",
"INC d",
"ISC d",
"INX",
"SBC #i",
"NOP",
"SBC #i",
"CPX a",
"SBC a",
"INC a",
"ISC a",
"BEQ *+d",
"SBC (d),y",
"STP",
"ISC (d),y",
"NOP d,x",
"SBC d,x",
"INC d,x",
"ISC d,x",
"SED",
"SBC a,y",
"NOP",
"ISC a,y",
"NOP a,x",
"SBC a,x",
"INC a,x",
"ISC a,x",
];

// Init CPU memory, flags, UI
CPU.init = function(){
  
  // CPU memory map
  CPU.memory = [];
  for(var i = 0; i < 0xFFFF; i++){
    CPU.memory[i] = 0;
  }
  
  // Place trainer in memory ($7000-$71FF), if any
  for(i = 0; i < gamepak.trainer.length; i++){
    CPU.memory[0x7000 + i] = gamepak.trainer[i];
  }

  // Place first and last PRG-ROM bank in memory ($8000-$BFFF + $C000-$FFFF)
  // TODO: enhance this after adding more mappers support.
  // TODO: mirror bank 2 in bank 1 if bank 1 is filled with 0 (except the last 32B that contain garbage).
  for(i = 0; i < 16 * 1024; i++){
    CPU.memory[0x8000 + i] = gamepak.PRG_ROM[0][i];
  }
  
  for(i = 0; i < 16 * 1024; i++){
    CPU.memory[0xC000 + i] = gamepak.PRG_ROM[gamepak.PRG_ROM_banks - 1][i];
  }
  
  // Interrupt vectors:
  
    // NMI vector ($FFFA-$FFFB, big-endian)
    CPU.nmi_vector = (CPU.memory[0xFFFB] << 8) + CPU.memory[0xFFFA];
    
    // Reset vector, also used when the system starts ($FFFC-$FFFD, big-endian)
    CPU.reset_vector = (CPU.memory[0xFFFD] << 8) + CPU.memory[0xFFFC];
    
    // IRQ/BRK vector ($FFFE-$FFFF, big-endian)
    CPU.irq_brk_vector = (CPU.memory[0xFFFF] << 8) + CPU.memory[0xFFFE];
    
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
  
    // Carry -bit 0)
    CPU.C = 0;
    
    // Zero (bit 1)
    CPU.Z = 0;
    
    // IRQ disable (bit 2)
    CPU.I = 0;
    
    // Decimal mode (bit 3)
    CPU.D = 0;
    
    // Break Flag (0 = IRQ/NMI, 1 = RESET/BRK/PHP) (bit 5)
    CPU.B = 0;
    
    // Overflow (bit 6)
    CPU.V = 0;
    
    // Negative (bit 7)
    CPU.N = 0;
    
  // UI
  
  // Table
  // TODO: update PRG-ROM page numbers on bankswitch
  cpu_memory_info.innerHTML = 
  `<table border>
    <tr><td>Internal RAM
    <tr><td><div id=internal_ram_info class=list>
    <tr><td>PPU I/O
    <tr><td><div id=ppu_io_info class=minilist></div>
    <tr><td>APU I/O
    <tr><td><div id=apu_io_info class=minilist></div>
    <tr><td>PRG-RAM
    <tr><td><div id=prg_ram_info class=minilist></div></div>
    <tr><td>PRG-ROM low page (bank 0)
    <tr><td><div id=prg_rom_low_page_info class=list></div>
    <tr><td>PRG-ROM high page (bank 1)
    <tr><td><div id=prg_rom_high_page_info class=list></div>
  </table>`;
  
  // Internal RAM
  var html = "";
  for(i = 0; i < 0x800; i++){
    html += `<div id=cpu_byte_${i}>${tools.format4(i)} : 00</div>`;
  }
  internal_ram_info.innerHTML = html;
  
  // PPU IO
  var html = "";
  for(i = 0x2000; i < 0x2008; i++){
    html += `<div id=cpu_byte_${i}>${tools.format4(i)} : 00</div>`;
  }
  ppu_io_info.innerHTML = html;
  
  // APU I/O
  var html = "";
  for(i = 0x4000; i < 0x4018; i++){
    html += `<div id=cpu_byte_${i}>${tools.format4(i)} : 00</div>`;
  }
  apu_io_info.innerHTML = html;
  
  // PRG-RAM
  var html = "";
  for(i = 0x6000; i < 0x8000; i++){
    html += `<div id=cpu_byte_${i}>${tools.format4(i)} : 00</div>`;
  }
  prg_ram_info.innerHTML = html;

  // PRG-ROM low page
  var html = "";
  var bytes_read = 0;
  var asm = "";
  var formatted_asm = "";
  for(i = 0x8000; i < 0xC000; i++){
    if(bytes_read == 0){
      formatted_asm = tools.format_asm(i);
      asm = formatted_asm[0];
      bytes_read = formatted_asm[1];
      if(i == 0xc7a0) console.log(asm);
      html += `<div id=cpu_byte_${i}>${tools.format4(i)} : ${tools.format2(CPU.memory[i])} ; ${asm}</div>`;
    }
    else {
      bytes_read--;
      html += `<div id=cpu_byte_${i}>${tools.format4(i)} : ${tools.format2(CPU.memory[i])}</div>`;
    }
  }
  prg_rom_low_page_info.innerHTML = html;
  
  // PRG-ROM high page
  var html = "";
  for(i = 0xC000; i <= 0xFFFF; i++){
    if(bytes_read == 0){
      formatted_asm = tools.format_asm(i);
      asm = formatted_asm[0];
      bytes_read = formatted_asm[1];
      if(i == 0xc7a8) console.log(asm);
      html += `<div id=cpu_byte_${i}>${tools.format4(i)} : ${tools.format2(CPU.memory[i])} ; ${asm}</div>`;
    }
    else {
      bytes_read--;
      html += `<div id=cpu_byte_${i}>${tools.format4(i)} : ${tools.format2(CPU.memory[i])}</div>`;
    }
  }
  prg_rom_high_page_info.innerHTML = html;
  
  // Mapper
  mapper_info.innerHTML =
  `<table border>
    <tr><td>NMI vector<td>$${tools.format4(CPU.nmi_vector)}
    <tr><td>Reset vector<td>$${tools.format4(CPU.reset_vector)}
    <tr><td>IRQ/BRK vector<td>$${tools.format4(CPU.irq_brk_vector)}
  </table>`;
  
  // Flags
  cpu_registers_flags_info.innerHTML =
  `<table border style="width:70px;float:left;margin:0 10px 0 0">
    <tr><td>A<td><pre>${tools.format2(CPU.A)}</pre>
    <tr><td>X<td><pre>${tools.format2(CPU.X)}</pre>
    <tr><td>Y<td><pre>${tools.format2(CPU.Y)}</pre>
    <tr style=background:#def><td>PC<td><pre>${tools.format4(CPU.PC)}</pre>
    <tr style=background:#fed><td>S<td><pre>${tools.format2(CPU.S)}</pre>
    <tr><td>P<td><pre>${tools.format2(CPU.P)}</pre>
  </table>
  
  <table border style="width:70px">
    <tr><td>C<td><pre>${CPU.C}</pre>
    <tr><td>Z<td><pre>${CPU.Z}</pre>
    <tr><td>I<td><pre>${CPU.I}</pre>
    <tr><td>D<td><pre>${CPU.D}</pre>
    <tr><td>B<td><pre>${CPU.B}</pre>
    <tr><td>V<td><pre>${CPU.V}</pre>
    <tr><td>N<td><pre>${CPU.N}</pre>
  </table>`;
  
  // Focus on stack pointer in internal RAM
  tools.focus("cpu_byte_" + CPU.S);
  
  // Focus on first instruction in PRG_ROM (PC = reset vector)
  tools.focus("cpu_byte_" + CPU.PC);
}