// Global
PPU = {};

// Init CPU memory, flags, UI
PPU.init = function(){
  
  // PPU memory map (16KB) + 1 view (unsigned int)
  PPU.memory_buffer = new ArrayBuffer(16 * 1024);
  PPU.memory = new Uint8Array(CPU.memory_buffer);

  // Place the first 8KB CHR-ROM bank in memory (it uses 2 4KB banks: $0000-$0FFF + $1000-$1FFF)
  // TODO: enhance this after adding more mappers support.
  if(gamepak.CHR_ROM_banks > 0){
    for(i = 0; i < 8 * 1024; i++){
      PPU.memory[0x0000 + i] = gamepak.CHR_ROM[0][i];
    }
  }
    
  // UI
  
  // TODO: update PRG-ROM bank numbers on bankswitch
  
  // Pattern tables
  var html = "";
  /*
  for(i = 0x0000; i < 0x2000; i++){
    html += `<div id=ppu_byte_${i}>${tools.format4(i)}: 00</div>`;
  }
  */
  for(i = 0x0000; i < 0x0005; i++){
    html += `<div id=ppu_byte_${i}>${tools.format4(i)}: 00</div>`;
  }
  pattern_tables_info.innerHTML = html;
  
  // Name tables + attributes tables
  var html = "";
  /*
  for(i = 0x2000; i < 0x3000; i++){
    html += `<div id=ppu_byte_${i}>${tools.format4(i)}: 00</div>`;
  }
  */
  for(i = 0x2000; i < 0x2005; i++){
    html += `<div id=ppu_byte_${i}>${tools.format4(i)}: 00</div>`;
  }
  nametables_info.innerHTML = html;

  // Palettes
  var html = "";
  for(i = 0x3f00; i < 0x3f05; i++){
    html += `<div id=ppu_byte_${i}>${tools.format4(i)}: 00</div>`;
  }
  /*
  for(i = 0x3f00; i < 0x3f20; i++){
    html += `<div id=ppu_byte_${i}>${tools.format4(i)}: 00</div>`;
  }
  */
  palettes_info.innerHTML = html;
  
  // OAM
  var html = "";
  for(i = 0; i < 0x50; i += 4){
    html += `<div id=oam_${i}>${tools.format2(i)}: 00 00 00 00</div>`;
  }
  /*
  for(i = 0; i < 0xff; i += 4){
    html += `<div id=oam_${i}>${tools.format2(i)}: 00 00 00 00</div>`;
  }
  */
  oam_memory_info.innerHTML = html;
  
  // Attributes tables
  var html = "";
  for(i = 0; i < 8; i++){
    for(j = 0; j < 8; j++){
      html += ` 00`;
    }
    html += "\n";
  }
  attributes_info_0.innerHTML = html;
  attributes_info_1.innerHTML = html;
  attributes_info_2.innerHTML = html;
  attributes_info_3.innerHTML = html;
  
  
  // Visual debug
  PPU.draw_tiles(0)
  PPU.draw_tiles(1)
  PPU.draw_nametables();
  PPU.draw_palettes();
  PPU.draw_screen();
}

PPU.draw_tiles = function(page){
  
  // Choose low / high page canvas
  var canvas = top["chr_rom_tiles_page_" + page];
  var ctx = canvas.getContext("2d");
  
  // Black background
  ctx.fillRect(0,0,256,512);
  
  // Each 8*8px tile is encoded on 16 bytes:
  // - Read a group of 8 bytes, make a grid of 8x8 bits with it.
  // - Read another group of 8 bytes, make another grid of 8*8 bits with it.
  // - Add the 2 grids.
  // - the resulting grid represents the sprite with a 4-color palette.
  var tile = 0;
  for(var i = page * 4 * 1024; i < (page + 1) * 4 * 1024; i += 16){
    for(k = 0; k < 8; k++){
      var b = PPU.memory[i + k];
      var bb = PPU.memory[i + 8 + k];
      for(j = 0; j < 8; j++){
        
        // binary addition
        var b1 = ((b >> (7 - j)) & 1) * 2 + ((bb >> (7 - j)) & 1);
        
        // The 4 palette indexes are represented with 4 shades of grey
        ctx.fillStyle = ["#000", "#555", "#aaa", "#fff"][b1];
        
        // Sprite pixels are zoomed 2x (drawn on 4px)
        ctx.fillRect((tile % 8) * 8 + j, ((~~(tile / 8))) * 8 + k, 1, 1);
      }
    }
    tile++;
  }
  
  /*// Add pink lines between tiles
  for(i = 0; i < 32; i++){
    ctx.fillStyle = "pink";
    ctx.fillRect(i * 16 - 1, 0, 1, 512);
    ctx.fillRect(0, i * 16 - 1, 256, 1);
  }*/
}

PPU.draw_nametables = function(){
  var canvas = nametables;
  var ctx = canvas.getContext("2d");
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, 512, 480);
  ctx.fillStyle = "pink";
  ctx.fillRect(0, 240, 512, 1);
  ctx.fillRect(256, 0, 1, 480);
}

PPU.draw_palettes = function(){
  var canvas = background_palette;
  var ctx = canvas.getContext("2d");
  ctx.fillRect(0, 0, 256, 32);
  var canvas = sprite_palette;
  var ctx = canvas.getContext("2d");
  ctx.fillRect(0, 0, 256, 32);
}

PPU.draw_screen = function(){
  var canvas = screen_canvas;
  var ctx = canvas.getContext("2d");
  ctx.fillRect(0, 0, 256, 242);
}