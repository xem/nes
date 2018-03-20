// Global
tools = {};

// Format a number on 2 hex numbers (1B)
tools.format2 = function(n){
  return ("0" + n.toString(16).toUpperCase()).slice(-2);
}

// Format a number on 4 hex numbers (2B)
tools.format4 = function(n){
  return ("000" + n.toString(16).toUpperCase()).slice(-4);
}

// Focus a list item
tools.focus = function(id){
  var element = document.getElementById(id);
  var parent = element.parentNode;
  element.classList.add("focus");
  parent.scrollTop = element.offsetTop - 14;
}

// Format an ASM instruction according to position in memory and addressing mode
// @param pointer in CPU memory
// @return [formatted_asm, extra_bytes_read];
tools.format_asm = function(pointer){
  var extra_bytes = 0;
  var asm = CPU.opcodes[CPU.memory[pointer]];
  
  // Indirect indexed: immediate 8-bit operand
  if(/d,X/.test(asm)){
     asm = asm.replace(/d,X/, "$" + tools.format2(CPU.memory[pointer + 1]) + ",X");
     extra_bytes = 1;
  }
  else if(/d,Y/.test(asm)){
     asm = asm.replace(/d,Y/, "$" + tools.format2(CPU.memory[pointer + 1]) + ",Y");
     extra_bytes = 1;
  }
  
  // Absolute indexed: immediate 16-bit operand
  else if(/a,X/.test(asm)){
     asm = asm.replace(/a,X/, "$" + tools.format4((CPU.memory[pointer + 2] << 8) + CPU.memory[pointer + 1]) + ",X");
     extra_bytes = 2;
  }
  else if(/a,Y/.test(asm)){
     asm = asm.replace(/a,Y/, "$" + tools.format4((CPU.memory[pointer + 2] << 8) + CPU.memory[pointer + 1]) + ",Y");
     extra_bytes = 2;
  }
  
  // Indexed indirect: immediate 8-bit operand
  else if(/\(d,X\)/.test(asm)){
     asm = asm.replace(/\(d,X\)/, "($" + tools.format2(CPU.memory[pointer + 1]) + ",X");
     extra_bytes = 1;
  }
  // Indirect indexed: immediate 8-bit operand
  else if(/\(d\),Y/.test(asm)){
     asm = asm.replace(/\(d\),Y/, "($" + tools.format2(CPU.memory[pointer + 1]) + "),Y");
     extra_bytes = 1;
  }
  
  // Immediate: 8-bit operand
  else if(/#i/.test(asm)){
     asm = asm.replace(/#i/, "#$" + tools.format2(CPU.memory[pointer + 1]));
     extra_bytes = 1;
  }
  
  // Zero page: immediate 8-bit zero page index
  else if(/ d$/.test(asm)){
     asm = asm.replace(/ d$/, " $" + tools.format2(CPU.memory[pointer + 1]));
     extra_bytes = 1;
  }
  
  // Relative: PC + 2 + immediate signed 8-bit operand
  else if(/\*\+d/.test(asm)){
     asm = asm.replace(/\*\+d/, "$" + tools.format4(pointer + 2 + CPU.memory_signed[pointer + 1]));
     extra_bytes = 1;
  }
  
  // Absolute: immediate 16-bit operand
  else if(/ a/.test(asm)){
     asm = asm.replace(/ a/, " $" + tools.format4((CPU.memory[pointer + 2] << 8) + CPU.memory[pointer + 1]));
     extra_bytes = 2;
  }
  
  // Indirect: immediate 16-bit address pointing to 16-bit instruction operand
  else if(/\(\a\)/.test(asm)){
     asm = asm.replace(/\(\a\)/, "($" + tools.format4((CPU.memory[pointer + 2] << 8) + CPU.memory[pointer + 1]) + ")");
     extra_bytes = 1;
  }
  
  return [asm, extra_bytes];
}