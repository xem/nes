// Global
tools = {};

// Format a number on 2 hex numbers (1B)
tools.format2 = function(n){
  if(typeof n !== "undefined"){
    return ("0" + n.toString(16).toUpperCase()).slice(-2);
  }
  return "error";
}

// Format a number on 4 hex numbers (2B)
tools.format4 = function(n){
  if(typeof n !== "undefined"){
    return ("000" + n.toString(16).toUpperCase()).slice(-4);
  }
  return "error";
}

// Focus a list item
tools.focus = function(id){
  if(!debug) return;
  var element = window[id];
  if(element){
    var parent = element.parentNode;
    var focused = parent.querySelector(".focus");
    if(focused){
      focused.classList.remove("focus");
    }
    element.classList.add("focus");
  }
}

// Format an ASM instruction with the right addressing mode
// @param pointer in CPU memory
tools.asm = function(pointer){
  var extra_bytes = 0;
  var asm = opcodes[cpu_read(pointer)];
  
  // Indirect indexed: immediate 8-bit operand
  if(/d,X/.test(asm)){
    asm = asm.replace(/d,X/, "$" + tools.format2(cpu_read(pointer + 1)) + ",X");
  }
  else if(/d,Y/.test(asm)){
    asm = asm.replace(/d,Y/, "$" + tools.format2(cpu_read(pointer + 1)) + ",Y");
  }
  
  // Absolute indexed: immediate 16-bit operand
  else if(/a,X/.test(asm)){
    asm = asm.replace(/a,X/, "$" + tools.format4((cpu_read(pointer + 2) << 8) + cpu_read(pointer + 1)) + ",X");
  }
  else if(/a,Y/.test(asm)){
    asm = asm.replace(/a,Y/, "$" + tools.format4((cpu_read(pointer + 2) << 8) + cpu_read(pointer + 1)) + ",Y");
  }
  
  // Indexed indirect: immediate 8-bit operand
  else if(/\(d,X\)/.test(asm)){
    asm = asm.replace(/\(d,X\)/, "($" + tools.format2(cpu_read(pointer + 1)) + ",X");
  }
  // Indirect indexed: immediate 8-bit operand
  else if(/\(d\),Y/.test(asm)){
    asm = asm.replace(/\(d\),Y/, "($" + tools.format2(cpu_read(pointer + 1)) + "),Y");
  }
  
  // Immediate: 8-bit operand
  else if(/#i/.test(asm)){
    asm = asm.replace(/#i/, "#$" + tools.format2(cpu_read(pointer + 1)));
  }
  
  // Zero page: immediate 8-bit zero page index
  else if(/ d$/.test(asm)){
    asm = asm.replace(/ d$/, " $" + tools.format2(cpu_read(pointer + 1)));
  }
  
  // Relative: PC + 2 + immediate signed 8-bit operand
  else if(/\*\+d/.test(asm)){
    asm = asm.replace(/\*\+d/, "$" + tools.format4(pointer + 2 + cpu_read(pointer + 1, 1)));
  }
  
  // Absolute: immediate 16-bit operand
  else if(/ a/.test(asm)){
    asm = asm.replace(/ a/, " $" + tools.format4((cpu_read(pointer + 2) << 8) + cpu_read(pointer + 1)));
  }
  
  // Indirect: immediate 16-bit address pointing to 16-bit instruction operand
  else if(/\(\a\)/.test(asm)){
    asm = asm.replace(/\(\a\)/, "($" + tools.format4((cpu_read(pointer + 2) << 8) + cpu_read(pointer + 1)) + ")");
  }
  
  return asm;
}