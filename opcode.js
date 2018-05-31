// Execute an opcode
// Update UI and cycles counters
op = function(){
  
  // Read opcode
  var opcode = cpu_read(PC);
  
  // Memory address where the opcode operand is stored
  var M = 0;
  
  // Number of bytes used by the opcode's operand
  var extra_bytes = 0;
  
  // CPU cycles used
  var cycles = 0;
  
  // Detect the addressing mode:
    
  // #i
  // Immediate
  if([0x09,0x0b,0x29,0x2b,0x49,0x4b,0x69,0x6b,0x80,0x82,0x89,0x8b,0xa0,0xa2,0xa9,0xab,0xc0,0xc2,0xc9,0xcb,0xe0,0xe2,0xe9,0xeb].includes(opcode)){
    
    // Operand address: PC + 1
    M = PC + 1;
    
    // 2 CPU cycles
    cycles += 2;
    
    // 1 extra byte is read
    extra_bytes = 1;
  }
  
  // d
  // Zero page
  else if([0x04,0x05,0x06,0x07,0x24,0x25,0x26,0x27,0x44,0x45,0x46,0x47,0x64,0x65,0x66,0x67,0x84,0x85,0x86,0x87,0xa4,0xa5,0xa6,0xa7,0xc4,0xc5,0xc6,0xc7,0xe4,0xe5,0xe6,0xe7].includes(opcode)){
    
    // Operand address: memory[PC + 1]
    M = cpu_read(PC + 1);
    
    // 2 CPU cycles
    cycles += 2;
    
    // 1 extra byte is read
    extra_bytes = 1;
  }
  
  // *+d
  // Relative
  else if([0x10,0x30,0x50,0x70,0x90,0xb0,0xd0,0xf0].includes(opcode)){
  
    // Operand address: PC + 2 + signed(memory[PC + 1])
    M = PC + 2 + cpu_read(PC + 1, 1);
    
    // 2* CPU cycles
    // TODO: 1 extra cycle is used if the branch succeeds and 2 extra cycles are used if the branch goes to a new page
    cycles += 2;
    
    // 1 extra byte is read
    extra_bytes = 1;
  }
  
  // a
  // Absolute
  else if([0x0c,0x0d,0x0e,0x0f,0x20,0x2c,0x2d,0x2e,0x2f,0x4c,0x4d,0x4e,0x4f,0x6d,0x6e,0x6f,0x8c,0x8d,0x8e,0x8f,0xac,0xad,0xae,0xaf,0xcc,0xcd,0xce,0xcf,0xec,0xed,0xee,0xef].includes(opcode)){
        
    // Operand address: (memory[PC + 2] << 8) + memory[PC + 1]
    M = (cpu_read(PC + 2) << 8) + cpu_read(PC + 1);
    
    // 3-6 CPU cycles
    // TODO: figure out why 3-6, 6502.js says 4
    cycles += 4;
    
    // 2 extra bytes are read
    extra_bytes = 2;
  }
  
  // (a)
  // Indirect
  else if(opcode == 0x6c){
    
    // Absolute address: a = (memory[PC + 2] << 8) + memory[PC + 1]
    // Operand address: (memory[a + 1] << 8) + memory[a]
    var a = (cpu_read(PC + 2) << 8) + cpu_read(PC + 1);
    M = (cpu_read(a + 1) << 8) + cpu_read(a);
    
    // 5 CPU cycles
    cycles += 5;
    
    // 2 extra bytes are read
    extra_bytes = 2;
  }
  
  // d,X
  // Zero page indexed
  else if([0x14,0x15,0x16,0x17,0x34,0x35,0x36,0x37,0x54,0x55,0x56,0x57,0x74,0x75,0x76,0x77,0x94,0x95,0xb4,0xb5,0xd4,0xd5,0xd6,0xd7,0xf4,0xf5,0xf6,0xf7].includes(opcode)){
  
    // Operand address: (memory[PC + 1] + X) % 256
    M = (cpu_read(PC + 1) + X) % 256;
    
    // 4-6 CPU cycles
    // TODO cycles
    cycles += 0;
    
    // 1 extra byte is read
    extra_bytes = 1;
  }
  
  // d,Y
  // Zero page indexed
  else if([0x96,0x97,0xb6,0xb7].includes(opcode)){
    // Operand address: (memory[PC + 1] + Y) % 256
    M = (cpu_read(PC + 1) + Y) % 256;
    
    // 4 CPU cycles
    cycles += 4;
    
    // 1 extra byte is read
    extra_bytes = 1;
  }
  
  // a,X
  // Absolute indexed
  else if([0x1c,0x1d,0x1e,0x1f,0x3c,0x3d,0x3e,0x3f,0x5c,0x5d,0x5e,0x5f,0x7c,0x7d,0x7e,0x7f,0x9c,0x9d,0xbc,0xbd,0xdc,0xdd,0xde,0xdf,0xfc,0xfd,0xfe,0xff].includes(opcode)){
    // Absolute address: a = (memory[PC + 2] << 8) + memory[PC + 1]
    // Operand address: a + X 
    var a = (cpu_read(PC + 2) << 8) + cpu_read(PC + 1);
    M = a + X;
    
    // 4-7 CPU cycles
    // TODO
    cycles += 0;
    
    // 2 extra bytes are read
    extra_bytes = 2;
  }
  
  // a,Y
  // Absolute indexed
  else if([0x19,0x1b,0x39,0x3b,0x59,0x5b,0x79,0x7b,0x99,0x9b,0x9e,0x9f,0xb9,0xbb,0xbe,0xbf,0xd9,0xdb,0xf9,0xfb].includes(opcode)){
    // Absolute address: a = (memory[PC + 2] << 8) + memory[PC + 1]
    // Operand address: a + Y 
    var a = (cpu_read(PC + 2) << 8) + cpu_read(PC + 1);
    M = a + Y;
    
    // 4-5 CPU cycles
    // TODO
    cycles += 0;
    
    // 2 extra bytes are read
    extra_bytes = 2;
  }
  
  // (d,X)
  // Indexed indirect
  else if([0x01,0x03,0x21,0x23,0x41,0x43,0x61,0x63,0x81,0x83,0xa1,0xa3,0xc1,0xc3,0xe1,0xe3].includes(opcode)){
    // Zero page index: d = memory[PC + 1]
    // Operand address: (memory[(d + X + 1) % 256] << 8) + memory[(d + X) % 256]
    var d = cpu_read(PC + 1);
    M = (cpu_read((d + X + 1) % 256) << 8) + cpu_read((d + X) % 256);
    
    // 6 CPU cycles
    cycles += 6;
    
    // 1 extra byte is read
    extra_bytes = 1;
  }
  
  // (d),Y
  // Indirect indexed
  else if([0x11,0x13,0x31,0x33,0x51,0x53,0x71,0x73,0x91,0x93,0xb1,0xb3,0xd1,0xd3,0xf1,0xf3].includes(opcode)){
    // Zero page index: d = memory[PC + 1]
    // Operand: (memory[(d + 1) % 256] << 8) + memory[d] + Y
    var d = cpu_read(PC + 1);
    M = (cpu_read((d + 1) % 256) << 8) + cpu_read(d) + Y;
    
    // 5-6 CPU cycles
    // TODO
    cycles += 0;
    
    // 1 extra byte is read
    extra_bytes = 1;
  }
  
  // Implicit
  // ($00, $40, $60, $02, $12, $22, $32, $42, $52, $62, $72, $92, $B2, $C2, $F2, $x8, $xA)
  else {
    
    // 2 CPU cycles
    cycles += 2;
  }
  
  if(debug)console.log("M: 0x" + M.toString(16))
  
  // Detect opcode
  switch(opcode){

    // ADC
    // Add M, A and C and store the result in A. C: set if bit 7 of result overflows, cleared otherwise. Z: set if A = 0, cleared otherwise. N: bit 7 of result
    case 0x61: // ADC (d,X)
    case 0x65: // ADC d
    case 0x69: // ADC #i
    case 0x6d: // ADC a
    case 0x71: // ADC (d),Y
    case 0x75: // ADC d,X
    case 0x79: // ADC a,Y
    case 0x7d: // ADC a,X
      var M = cpu_read(M);
      var result = A + M + C;
      if(result > 0xFF){
        set_c();
      }
      else {
        clear_c();
      }
      A = result & 0xFF;
      update_z(A);
      update_n(A);
      break;
    
    // AND
    // Store in A the result of M AND A. Z: set if A = 0, cleared otherwise. N: bit 7 of result
    case 0x21: // AND (d,X)
    case 0x25: // AND d
    case 0x29: // AND #i
    case 0x2d: // AND a
    case 0x31: // AND (d),Y
    case 0x35: // AND d,X
    case 0x39: // AND a,Y
    case 0x3d: // AND a,X
      A = cpu_read(M) & A;
      update_z(A);
      update_n(A);
      break;
      
    // BEQ
    // Branch to relative address (PC += rel) if Z = 1. rel is signed
    case 0xf0: // BEQ *+d
      if(Z == 1){
        PC = M - 1;
        extra_bytes = 0;
      }
      break;
      
    // BNE
    // Branch to relative address (PC += rel) if Z = 0
    case 0xd0: // BNE *+d
      if(Z == 0){
        PC = M - 1;
        extra_bytes = 0;
      }
      break;
      
    // BPL
    // Branch to relative address (PC += rel) if N = 0
    case 0x10: // BPL *+d
      if(N == 0){
        PC = M - 1;
        extra_bytes = 0;
      }
      break;
    
    // CLC
    // Clear carry flag
    case 0x18: // CLC
      clear_c();
      break;
    
    // CLD
    // Clear decimal flag
    case 0xD8: // CLD
      clear_d();
      break;
      
    // CMP
    // Compare A and M. C: set if A >= M, cleared otherwise. Z: set if A = M, cleared otherwise. N: bit 7 of result
    case 0xc1: // CMP (d,X)
    case 0xc5: // CMP d
    case 0xc9: // CMP #i
    case 0xcd: // CMP a
    case 0xd1: // CMP (d),Y
    case 0xd5: // CMP d,X
    case 0xd9: // CMP a,Y
    case 0xdd: // CMP a,X
      var value = A - cpu_read(M);
      if(A >= cpu_read(M)){
        set_c();
      }
      else {
        clear_c();
      }
      update_z(value);
      update_n(value);
      break;
      
    // CPX
    // Compare X and M. C: set if X >= M, cleared otherwise. Z: set if X = M, cleared otherwise. N: bit 7 of X - M
    case 0xe0: // CPX #i 
    case 0xe4: // CPX d
    case 0xec: // CPX a
      var value = X - cpu_read(M);
      if(X >= cpu_read(M)){
        set_c();
      }
      else {
        clear_c();
      }
      update_z(value);
      update_n(value);
      break;

    // CPY
    // Compare Y and M. C: set if Y >= M, cleared otherwise. Z: set if Y = M, cleared otherwise. N: bit 7 of Y - M
    case 0xc0: // CPY #i
    case 0xc4: // CPY d
    case 0xcc: // CPY a
      var value = Y - cpu_read(M);
      if(X >= cpu_read(M)){
        set_c();
      }
      else {
        clear_c();
      }
      update_z(value);
      update_n(value);
      break;
      
    // DEC
    // Decrement M. Z: result = 0. N: bit 7 of result
    case 0xc6: // DEC d
    case 0xce: // DEC a
    case 0xd6: // DEC d,X
    case 0xde: // DEC a,X
      var value = (cpu_read(M) - 1) & 0xFF;
      write(M, value);
      update_z(value);
      update_n(value);
      break;
    
    // DEX
    // Decrement Y. Z: result = 0. N: bit 7 of result
    case 0xca: // DEX
      X = (X - 1) & 0xFF;
      update_z(X);
      update_n(X);
      break;
      
    // DEY
    // Decrement Y. Z: result = 0. N: bit 7 of result
    case 0x88: // DEY
      Y = (Y - 1) & 0xFF;
      update_z(Y);
      update_n(Y);
      break;
      
    // EOR
    // XOR A and M, bit by bit. Z: set if A = 0, cleared otherwise. N: bit 7 of result
    case 0x41: // EOR (d,X)
    case 0x45: // EOR d
    case 0x49: // EOR #i
    case 0x4d: // EOR a
    case 0x51: // EOR (d),Y
    case 0x55: // EOR d,X
    case 0x59: // EOR a,Y
    case 0x5d: // EOR a,X
      A = A ^ cpu_read(M);
      update_z(A);
      update_n(A);
      break;
      
    // INX
    // Increment Y (if 255: set it to 0). Z: set if result = 0, cleared otherwise. N: bit 7 of result
    case 0xe8: // INX
      X = (X + 1) & 0xFF;
      update_z(X);
      update_n(X);
      break;

    // INY
    // Increment Y (if 255: set it to 0). Z: set if result = 0, cleared otherwise. N: bit 7 of result
    case 0xc8: // INY
      Y = (Y + 1) & 0xFF;
      update_z(Y);
      update_n(Y);
      break;
    
    // JMP
    // Jump (set PC) to the address in the M.
    case 0x4c: // JMP a
    case 0x6c: // JMP (a)
      PC = M - 1;
      extra_bytes = 0;
      break;
      
    // JSR
    // Jump to subroutine: push PC - 1 on the stack and set PC to the address in M
    case 0x20: // JSR a
      write(S + 0x100, (PC + 2) >> 8);
      S = (S - 1) & 0xFF;
      write(S + 0x100, (PC + 2) & 0xFF);
      S = (S - 1) & 0xFF;
      draw_internal_ram(S + 0x100);
      PC = M - 1;
      extra_bytes = 0;
      cycles += 2;
      break;
    
    // LDA
    // Load M in A. Z: set if A = 0, cleared otherwise. N: bit 7 of A
    case 0xa1: // LDA (d,X)
    case 0xa5: // LDA d
    case 0xa9: // LDA #i
    case 0xad: // LDA a
    case 0xb1: // LDA (d),Y
    case 0xb5: // LDA d,X
    case 0xb9: // LDA a,Y
    case 0xbd: // LDA a,X
      A = cpu_read(M);
      update_z(A);
      update_n(A);
      break;
      
    // LDX
    // Load M in X. Z: set if X = 0, cleared otherwise. N: bit 7 of X
    case 0xa2: // LDX #i
    case 0xa6: // LDX d
    case 0xae: // LDX a
    case 0xb6: // LDX d,Y
    case 0xbe: // LDX a,Y
      X = cpu_read(M);
      update_z(X);
      update_n(X);
      break;
      
    // LDY
    // Load M in Y. Z: set if Y = 0. N: bit 7 of Y
    case 0xa0: // LDY #i
    case 0xa4: // LDY d
    case 0xac: // LDY a
    case 0xb4: // LDY d,X
    case 0xbc: // LDY a,X
      Y = cpu_read(M);
      update_z(Y);
      update_n(Y);
      break;
      
    // LSR A
    // Right shift A after putting bit 0 in C. Bit 7 = 0. Z: set if result = 0, cleared otherwise. N: bit 7 of result
    case 0x4a: // LSR = LSR A
      var value = A;
      if((value & 0b1) == 1){
        set_c();
      }
      else {
        clear_c();
      }
      value = value >> 1;
      update_z(value);
      update_n(value);
      A = value;
      break;
    
    // LSR
    // Right shift M after putting bit 0 in C. Bit 7 = 0. Z: set if result = 0, cleared otherwise. N: bit 7 of result
    case 0x46: // LSR d
    case 0x4e: // LSR a
    case 0x56: // LSR d,X
    case 0x5e: // LSR a,X
      var value = cpu_read(M);
      if((value & 0b1) == 1){
        set_c();
      }
      else {
        clear_c();
      }
      value = value >> 1;
      update_z(value);
      update_n(value);
      write(M, value);
      cycles += 2;
      break;
      
    // PHA
    // Push A on the stack
    case 0x48: // PHA
      write(S + 0x100, A);
      S = (S - 1) & 0xFF;
      draw_internal_ram(S + 0x100);
      cycles++;
      break;
      
    // PLA
    // Pull A from the stack. Z: set if A = 0, cleared otherwise. N: bit 7 of A
    case 0x68:
      S = (S + 1) & 0xFF;
      A = cpu_read(S + 0x100);
      update_z(A);
      update_n(A);
      cycles += 2;
      break;
    
    // ROL
    // Save C in a var. Put bit 7 of operand in C. Left shift operand. Bit 0 = saved C. Z: set if operand is 0, 1 otherwise. N: bit 7 of operand
    case 0x2a: // ROL A
      var tmp = C;
      C = A >> 7;
      A = (A << 1) & 0xFF;
      A |= tmp;
      update_z(A);
      update_n(A);
      break;

    case 0x26: // ROL d
    case 0x2e: // ROL a
    case 0x36: // ROL d,X
    case 0x3e: // ROL a,X
      var tmp = C;
      var value = cpu_read(M);
      C = value >> 7;
      value = (value << 1) & 0xFF;
      value |= tmp;
      update_z(value);
      update_n(value);
      write(M, value);
      cycles += 2;
      break;
    
    // ROR
    // Save C in a var. Put bit 0 of operand in C. Right shift operand. Bit 7 = saved C. Z: set if operand is 0, 1 otherwise. N: bit 7 of operand
    case 0x6a: // ROR A
      var tmp = C;
      C = A & 0b1;
      A = A >> 1;
      A |= (tmp << 7);
      update_z(A);
      update_n(A);
      break;
      
    case 0x66: // ROR d
    case 0x6e: // ROR a
    case 0x76: // ROR d,X
    case 0x7e: // ROR a,X
      var tmp = C;
      var value = cpu_read(M);
      C = value & 0b1;
      value = value >> 1;
      value |= (tmp << 7);
      update_z(value);
      update_n(value);
      write(M, value);
      cycles += 2;
      break;
    
    // RTS
    // Return from subroutine: pull PC - 1 from the stack (the lowest byte, then the highest byte, see JSR)
    case 0x60: // RTS
      S = (S + 1) & 0xFF;
      PC = cpu_read(S + 0x100);
      S = (S + 1) & 0xFF;
      PC = (cpu_read(S + 0x100) << 8) + PC;
      extra_bytes = 0;
      cycles += 4;
      break;
    
    // SEI
    // Set interrupt disable flag
    case 0x78: // SEI
      set_i();
      break;

    // STA
    // Store A in M
    case 0x81: // STA (d,X)
    case 0x85: // STA d
    case 0x8d: // STA a
    case 0x91: // STA (d),Y
    case 0x95: // STA d,X
    case 0x99: // STA a,Y
    case 0x9d: // STA a,X
      write(M, A);
      break;
      
    // STY
    // Store Y in M
    case 0x84: // STY d
    case 0x8c: // STY a
    case 0x94: // STY d,X
      write(M, Y);
      break;
      
    // TAX
    // Copy A in X. Z: set if X = 0, cleared otherwise. N: bit 7 of X
    case 0xaa: // TAX
      X = A;
      update_z(X);
      update_n(X);
      break;
      
    // TAY
    // Copy A in Y. Z: set if Y = 0, cleared otherwise. N: bit 7 of Y
    case 0xa8: // TAY
      Y = A;
      update_z(Y);
      update_n(Y);
      break;
    
    // TXA
    // Copy X in A. Z: set if A = 0, cleared otherwise. N: bit 7 of A
    case 0x8a: // TXA
      A = X;
      update_z(A);
      update_n(A);
      break;
    
    // TYA
    // Copy Y in A. Z: set if A = 0, cleared otherwise. N: bit 7 of A
    case 0x98: // TYA
      A = Y;
      update_z(A);
      update_n(A);
      break;
    
    // TXS
    // Copy X in S
    case 0x9A: // TXS
      S = X;
      break;
      
    default:
      alert("unimplemented: " + tools.format2(opcode));
  }
  
  // Update PC
  PC = PC + extra_bytes + 1;
  
  // Ticks
  // The PPU and APU tick 3 times during each CPU tick
  cycles += cycles;
  for(var i = 0; i < cycles; i++){
    ppu_tick();
    ppu_tick();
    ppu_tick();
    /*
    APU.tick();
    APU.tick();
    APU.tick();
    */
  }
  
  if(debug){
    update_ui();
  }
}


// Opcode helpers
set_i = function(){
  
  // Set I
  I = 1;
  
  // Update P
  P = P | 0b100;
}

clear_d = function(){
  
  // clear D
  D = 0;
  
  // Update P
  P = P & 0b11110111;
}

update_z = function(value){
  
  // Test
  if(value === 0){
    
    // Set Z
    Z = 1;
    
    // Update P
    P = P | 0b00000010;
  }
  
  else {
    
    // Clear Z
    Z = 0;
    
    // Update P
    P = P & 0b11111101;
  }
}

update_n = function(value){
  
  // Set N
  N = (value >> 7) & 0b1;
  
  // Update P
  if(N === 1){
    P = (P | 0b10000000);
  }
  else {
    P = (P & 0b01111111);
  }
}

/*
set_c_borrow = function(value){
  
  // Set C
  C = value >= 0 ? 1 : 0;
  
  // Update P
  if(C === 1){
    P = (P | 0b00000001);
  }
  else {
    P = (P & 0b11111110);
  }
  
  // UI
  c_info.innerHTML = C;
}

set_c_carry = function(value){
  
  // Set C
  C = value >= 0 ? 0 : 1;
  
  // Update P
  if(C === 1){
    P = (P | 0b00000001);
  }
  else {
    P = (P & 0b11111110);
  }
  
  // UI
  c_info.innerHTML = C;
}
*/

set_c = function(){
  
  // Set C
  C = 0;
  
  // Update P
  P = (P | 0b00000001);
}

clear_c = function(){
  
  // Clear C
  C = 0;
  
  // Update P
  P = (P & 0b11111110);
}

// UI update
update_ui = function(){
  a_info.innerHTML = tools.format2(A);
  x_info.innerHTML = tools.format2(X);
  y_info.innerHTML = tools.format2(Y);
  pc_info.innerHTML = tools.format4(PC);
  s_info.innerHTML = tools.format2(S);
  c_info.innerHTML = C;
  z_info.innerHTML = Z;
  i_info.innerHTML = I;
  d_info.innerHTML = D;
  b_info.innerHTML = B;
  v_info.innerHTML = V;
  n_info.innerHTML = N;
  cpu_cycles_info.innerHTML = cycles;
  draw_prg_rom_low_page(PC);
  draw_prg_rom_high_page(PC);
}

// for(i in opcodes)if(/EOR/.test(opcodes[i]))console.log("case 0x" + (+i).toString(16) + ": // " + opcodes[i])