// Global
PPU = {};

// Init CPU memory, flags, UI
PPU.init = function(){
  
  // PPU memory map (64KB) + 1 view (unsigned int)
  PPU.memory_buffer = new ArrayBuffer(64 * 1024);
  PPU.memory = new Uint8Array(CPU.memory_buffer);

  // Place first and last CHR-ROM bank in memory ($0000-$0FFF + $1000-$1FFF)
  // TODO: enhance this after adding more mappers support.
  for(i = 0; i < 8 * 1024; i++){
    PPU.memory[0x0000 + i] = gamepak.CHR_ROM[0][i];
  }
  
  for(i = 0; i < 8 * 1024; i++){
    PPU.memory[0x1000 + i] = gamepak.CHR_ROM[gamepak.CHR_ROM_banks - 1][i];
  }
    
  // UI
  
  // Table
  // TODO: update PRG-ROM bank numbers on bankswitch
  ppu_memory_info.innerHTML = 
  `<table border>
    <tr><td>CHR-ROM low (bank 0)<td>CHR-ROM high (bank 1)
    <tr><td><canvas id=chr_rom_tiles_low width=128 height=512><td><canvas id=chr_rom_tiles_high width=128 height=512>
  </table>`;
  
  PPU.draw_tiles(0);
  PPU.draw_tiles(1);
}

PPU.draw_tiles = function(page){
  var canvas = page ? chr_rom_tiles_high : chr_rom_tiles_low;
  var ctx = canvas.getContext("2d");
  ctx.fillRect(0,0,256,512);
  var tile = 0;
  for(var i = page * 8 * 1024; i < (page + 1) * 8 * 1024; i += 16){
    
    for(k = 0; k < 8; k++){
      var b = PPU.memory[i + k];
      var bb = PPU.memory[i + 8 + k];
      for(j = 0; j < 8; j++){
        var b1 = ((b >> (7 - j)) & 1) * 2 + ((bb >> (7 - j)) & 1);
        ctx.fillStyle = ["#000","#555","#aaa","#fff"][b1];
        ctx.fillRect(
          (tile % 8) * 16 + j * 2, // x
          ((~~(tile / 8))) * 16 + k * 2, // y
          2, // w
          2 // h
        );
      }
    }
    tile++;
  }
  
  for(i=0;i<32;i++){
    ctx.fillStyle = "pink";
    ctx.fillRect(i*16-1,0,1,512);
    ctx.fillRect(0,i*16-1,256,1);
  }
}