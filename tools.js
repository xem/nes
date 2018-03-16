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

// Format an ASM instruction
// @param pointer in CPU memory
// @return [formatted_asm, extra_bytes_read];
tools.format_asm = function(pointer){
  var extra_bytes = 0;
  var asm = CPU.opcodes[CPU.memory[pointer]];
  
  // Immediate operand (1B)
  if(/#i/.test(asm)){
     asm = asm.replace(/#i/, "#$" + tools.format2(CPU.memory[pointer + 1]));
     extra_bytes = 1;
  }
  
  // Absolute operand (2B)
  else if(/ a/.test(asm)){
     asm = asm.replace(/ a/, " $" + tools.format4((CPU.memory[pointer + 2] << 8) + CPU.memory[pointer + 1]));
     extra_bytes = 2;
  }
  
  // Relative (1B)
  else if(/\*\+d/.test(asm)){
     asm = asm.replace(/\*\+d/, " $" + tools.format4(pointer + 2 + signed8(CPU.memory[pointer + 1])));
     extra_bytes = 2;
  }
  
  return [asm, extra_bytes];
}

// Convert a 8-bit value to a signed integer
signed8 = function(n){
  return n < 128 ? n : -256 + n;
}