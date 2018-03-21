// Global
PPU = {};

// Init CPU memory, flags, UI
PPU.init = function(){
  
  // PPU memory map (64KB) + 1 view (unsigned int)
  PPU.memory_buffer = new ArrayBuffer(64 * 1024);
  PPU.memory = new Uint8Array(CPU.memory_buffer);

  // Place first and last CHR-ROM bank in memory ($0000-$0FFF + $1000-$1FFF)
  // TODO: enhance this after adding more mappers support.
  if(gamepak.CHR_ROM_banks >= 1){
    for(i = 0; i < 8 * 1024; i++){
      PPU.memory[0x0000 + i] = gamepak.CHR_ROM[0][i];
    }
  
    for(i = 0; i < 8 * 1024; i++){
      PPU.memory[0x1000 + i] = gamepak.CHR_ROM[gamepak.CHR_ROM_banks - 1][i];
    }
  }
    
  // UI
  
  // Table
  // TODO: update PRG-ROM bank numbers on bankswitch
  ppu_memory_info.innerHTML = 
  `<table border>
    <tr><td>Pattern tables (CHR-ROM)
    <tr><td><div id=pattern_tables_info class=minilist>
    <tr><td>Name tables + attributes table
    <tr><td><div id=nametables_info class=minilist></div>
    <tr><td>Palettes
    <tr><td><div id=palettes_info class=minilist></div></div>
  </table>`;
  
  ppu_memory_info_1.innerHTML = 
  `<table border>
    <tr><td>CHR-ROM low (bank 0)<td>CHR-ROM high (bank 1)
    <tr><td><canvas id=chr_rom_tiles_low width=128 height=512><td><canvas id=chr_rom_tiles_high width=128 height=512>
  </table>`;
  
  ppu_memory_info_2.innerHTML = 
  `<table border>
    <tr><td colspan=2>Name tables
    <tr><td colspan=2><canvas id=nametables width=512 height=480>
    <tr><td>Background palette<td>Sprite palette
    <tr><td><canvas id=background_palette width=256 height=16><td><canvas id=sprite_palette width=256 height=16>
  </table>`;
  
  ppu_memory_info_3.innerHTML = 
  `<table border height=256>
    <tr><td colspan=2 style="max-height:16px">Attributes tables
    <tr><td height=128>0<br>0<br>0<br>0<br>0<br>0<br>0<br>0<td>1<br>1<br>1<br>1<br>1<br>1<br>1<br>1
    <tr><td height=128>2<br>2<br>2<br>2<br>2<br>2<br>2<br>2<td>3<br>3<br>3<br>3<br>3<br>3<br>3<br>3
  </table>`;
  
  oam_info.innerHTML = 
  `<table border>
    <tr><td><div id=oam_memory_info class=maxilist>
  </table>`;
  
  screen_info.innerHTML = 
  `<table border>
    <tr><td><canvas id=screen_canvas width=256 height=242>
  </table>`;
  
  PPU.draw_tiles(0);
  PPU.draw_tiles(1);
  PPU.draw_nametables();
  PPU.draw_palettes();
  PPU.draw_screen();
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

PPU.draw_nametables = function(){
  var canvas = nametables;
  var ctx = canvas.getContext("2d");
  ctx.fillRect(0,0,512,480);
  ctx.fillStyle = "pink";
  ctx.fillRect(256,0,1,480);
  ctx.fillRect(0,240,512,1);
}

PPU.draw_palettes = function(){
  var canvas = background_palette;
  var ctx = canvas.getContext("2d");
  ctx.fillRect(0,0,256,32);
  var canvas = sprite_palette;
  var ctx = canvas.getContext("2d");
  ctx.fillRect(0,0,256,32);
}

PPU.draw_screen = function(){
  var canvas = screen_canvas;
  var ctx = canvas.getContext("2d");
  ctx.fillRect(0,0,256,242);
}