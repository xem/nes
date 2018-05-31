// Global
/*PPU = {
  
  // Memory
  memory_buffer: null,
  memory: null,
  oam_buffer: null,
  oam: null,
  
  // Cycles
  cycles: 0,
  
  // Pixels
  x: 0,
  y: 0,
  
  // Frame
  frame: 0,
  
  // Canvas
  screen_ctx: null,
  
};*/

ppu_draw_tiles = function(page){
  
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
      var b = ppu_read(i + k);
      var bb = ppu_read(i + 8 + k);
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
}

ppu_draw_nametables = function(){
  var canvas = nametables;
  var ctx = canvas.getContext("2d");
  ctx.fillStyle = "pink";
  ctx.fillRect(0, 240, 512, 1);
  ctx.fillRect(256, 0, 1, 480);
}

ppu_draw_palettes = function(){
  var canvas = background_palette;
  var ctx = canvas.getContext("2d");
  ctx.fillRect(0, 0, 256, 32);
  var canvas = sprite_palette;
  var ctx = canvas.getContext("2d");
  ctx.fillRect(0, 0, 256, 32);
}

ppu_draw_screen = function(){
  
}

// Read/write a byte in PPU memory
ppu_read_write = function(address, signed, value){
  
  // Write
  var write = typeof value !== "undefined";
  
  // $4000-$FFFF: mirrors of $0000-$3FFF
  if(address > 0x3FFF){
    address %= 0x4000;
  }
  
  // $3F20-$3FFF: mirrors of $3F00-$3F1F
  if(address >= 0x3F20 && address <= 0x3FFF){
    address = (address - 0x3F20) % 0x20;
  }
  
  // $3000-$3EFF: mirror of $2000-$2EFF
  if(address >= 0x3000 && address <= 0x3EFF){
    address = address - 0x3000 + 0x2000;
  }
  
  // Write
  if(write && address >= 0x2000){
    ppu_memory[address] = value;
  }
  
  // Read
  else if(!write){
    
    // Read from CHR-ROM low bank
    // TODO: bankswitch
    // Default: bank 0 (first 4KB)
    if(address < 0x1000){
      return CHR_ROM[0][address];
    }
    
    // Read from CHR-ROM high bank
    // TODO: bankswitch
    // Default: (bank 0 (last 4KB)
    else if(address < 0x2000){
      return CHR_ROM[0][address];
    }
    
    // Read from PPU memory
    return ppu_memory[address];
  }
}

// Read a byte from PPU memory
ppu_read = function(address, signed = 0){
  return ppu_read_write(address, signed);
}

// Write a byte in PPU memory
// If the byte is written on a read-only address, the memory isn't changed.
ppu_write = function(address, value){
  ppu_read_write(address, 0, value);
}


// Tick
ppu_tick = function(){
  ppu_cycles++;
  ppu_x ++;
  
  // New line
  if(ppu_x > 341){
    ppu_x = 0;
    ppu_y++;
  }
  
  //if(PPU.y > 240) console.log(PPU.x, PPU.y);
  
  // VBlank
  // Set bit 7 of CPU $2002 after scanline 241
  if(ppu_y == 242 && ppu_x == 0){
    ppu_write(0x2002, ppu_read(0x2002) | 0b10000000);
  }
  
  // Pre-render line (261 on NTSC, 311 on PAL)
  // Clear bit 7 of CPU $2002
  // Increment frame counter (for debugger only)
  if(ppu_x == 0 && ((!PAL && ppu_y == 261) || (PAL && ppu_y == 311))){
    ppu_write(0x2002, CPU.read(0x2002) & 0b01111111);
    ppu_frame++;
    ppu_y = 0;
    frame_info.innerHTML = ppu_frame;
  }
  
  if(debug){
    screen_x_info.innerHTML = ppu_x;
    screen_y_info.innerHTML = ppu_y;
  
    screen_canvas.width = screen_canvas.width; 
    ppu_screen_ctx.fillStyle = "red";
    ppu_screen_ctx.fillRect(ppu_x, ppu_y, 2, 2);
  }
  
}