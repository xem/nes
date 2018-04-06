// Global
PPU = {
  
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
  
};

// Init CPU memory, flags, UI
PPU.init = function(){
  
  // PPU memory + 1 view (unsigned int)
  // (Only the first 16KB of the memory is initialized, the rest is mirrored)
  PPU.memory_buffer = new ArrayBuffer(16 * 1024);
  PPU.memory = new Uint8Array(PPU.memory_buffer);
  
  // OAM memory (256B) + 1 view (unsigned int)
  PPU.oam_buffer = new ArrayBuffer(256);
  PPU.oam = new Uint8Array(PPU.oam_buffer);
  
  // Canvas
  PPU.screen_ctx = screen_canvas.getContext("2d");
    
  // UI
  // TODO: update PRG-ROM bank numbers on bankswitch
  
  // Pattern tables
  var html = "";

  for(i = 0x0000; i < 0x0005; i++){
    html += `<div id=ppu_byte_${i}>${tools.format4(i)}: ${tools.format2(PPU.read(i))}</div>`;
  }
  pattern_tables_info.innerHTML = html;
  
  // Name tables + attributes tables
  var html = "";

  for(i = 0x2000; i < 0x2005; i++){
    html += `<div id=ppu_byte_${i}>${tools.format4(i)}: ${tools.format2(PPU.read(i))}</div>`;
  }
  nametables_info.innerHTML = html;

  // Palettes
  var html = "";
  for(i = 0x3f00; i < 0x3f05; i++){
    html += `<div id=ppu_byte_${i}>${tools.format4(i)}: ${tools.format2(PPU.read(i))}</div>`;
  }

  palettes_info.innerHTML = html;
  
  // OAM
  var html = "";
  for(i = 0; i < 0x50; i += 4){
    html += `<div id=oam_${i}>${tools.format2(i)}: ${tools.format2(PPU.oam[i])} ${tools.format2(PPU.oam[i + 1])} ${tools.format2(PPU.oam[i + 2])} ${tools.format2(PPU.oam[i + 3])}</div>`;
  }

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
      var b = PPU.read(i + k);
      var bb = PPU.read(i + 8 + k);
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

PPU.draw_nametables = function(){
  var canvas = nametables;
  var ctx = canvas.getContext("2d");
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
  
}

// Read/write a byte in PPU memory
PPU.read_write = function(address, signed, value){
  
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
    PPU.memory[address] = value;
  }
  
  // Read
  else if(!write){
    
    // Read from CHR-ROM low bank
    // TODO: bankswitch
    // Default: bank 0 (first 4KB)
    if(address < 0x1000){
      return gamepak.CHR_ROM[0][address];
    }
    
    // Read from CHR-ROM high bank
    // TODO: bankswitch
    // Default: (bank 0 (last 4KB)
    else if(address < 0x2000){
      return gamepak.CHR_ROM[0][address];
    }
    
    // Read from PPU memory
    return PPU.memory[address];
  }
}

// Read a byte from PPU memory
PPU.read = function(address, signed = 0){
  return PPU.read_write(address, signed);
}

// Write a byte in PPU memory
// If the byte is written on a read-only address, the memory isn't changed.
PPU.write = function(address, value){
  PPU.read_write(address, 0, value);
}


// Tick
PPU.tick = function(){
  PPU.cycles++;
  PPU.x ++;
  
  // New line
  if(PPU.x > 341){
    PPU.x = 0;
    PPU.y++;
  }
  
  //if(PPU.y > 240) console.log(PPU.x, PPU.y);
  
  // VBlank
  // Set bit 7 of CPU $2002 after scanline 241
  if(PPU.y == 242 && PPU.x == 0){
    CPU.write(0x2002, CPU.read(0x2002) | 0b10000000);
  }
  
  // Pre-render line (261 on NTSC, 311 on PAL)
  // Clear bit 7 of CPU $2002
  // Increment frame counter (for debugger only)
  if(PPU.x == 0 && ((!gamepak.PAL && PPU.y == 261) || (gamepak.PAL && PPU.y == 311))){
    CPU.write(0x2002, CPU.read(0x2002) & 0b01111111);
    PPU.frame++;
    PPU.y = 0;
    frame_info.innerHTML = PPU.frame;
  }
  
  if(debug){
    screen_x_info.innerHTML = PPU.x;
    screen_y_info.innerHTML = PPU.y;
  
    screen_canvas.width = screen_canvas.width; 
    PPU.screen_ctx.fillStyle = "red";
    PPU.screen_ctx.fillRect(PPU.x, PPU.y, 2, 2);
  }
  
}