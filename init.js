/*// Gamepak
gamepak = {
  
  // Settings
  TV_system: "",
  PAL: 0,
  mapper: 0,
  submapper: 0,
  trainer_bank: 0,
  PRG_ROM_banks: 0,
  PRG_RAM_banks: 0,
  CHR_ROM_banks: 0,
  CHR_RAM_banks: 0,
  extra_ROM_banks: 0,
  mirroring: 0,
  iNES: 0,
  Vs: 0,
  PC10: 0,
  PRG_RAM_bytes_battery_backed: 0,
  CHR_RAM_bytes_battery_backed: 0,
  PRG_RAM_bytes_not_battery_backed: 0,
  CHR_RAM_bytes_not_battery_backed: 0,
  
  // ROM banks
  
  PRG_ROM_buffer: [],
  PRG_ROM_signed: [],
  PRG_ROM: [],
  
  CHR_ROM_buffer: [],
  CHR_ROM: [],
  
  // ASM code for each PRG-ROM bank opcode
  asm: [],
  
};*/

// Globals
debug = true;

// Init emulator, debugger, CPU and PPU based on a file and filename
init = function(file, filename){
  
  // Parse ROM file
  // ==============

  // Transform the file in an array of bytes
  var bytes = new Uint8Array(file.result);
  
  // Parse 16-byte iNES header (starts with bytes $4E $45 $53 $1A, file extension is generally ".nes")
  if(bytes[0] == 0x4E && bytes[1] == 0x45 && bytes[2] == 0x53 && bytes[3] == 0x1A){
  
    // Byte 4: Number of 16KB PRG-ROM banks 
    PRG_ROM_banks = bytes[4];
    
    // Byte 5: Number of 8KB CHR-ROM banks (if 0 => use 1 CHR-RAM bank)
    CHR_ROM_banks = bytes[5];
    CHR_RAM_banks = CHR_ROM_banks > 1 ? 0 : 1;
    
    // Byte 6:
    
      // Bit 0: Nametable mirroring (0 => horizontal / 1 => vertical)
      mirroring = bytes[6] & 0b1;
      
      // Bit 1: Cartridge contains battery-backed PRG-RAM (CPU $6000-$7FFF)
      PRG_RAM_banks = (bytes[6] & 0b10) >> 1;
      
      // Bit 2: Cartridge contains a 512B trainer (CPU $7000-$71FF)
      trainer_bank = (bytes[6] & 0b100) >> 2;
      
      // Bit 3: Ignore mirroring in bit 0, use 4-screen nametable instead, the cartridge provides 2KB of VRAM.
      if((bytes[6] & 0b1000) >> 3){
        mirroring = -1;
      }
      
      // Bits 4-7: Bits 0-3 of mapper number
      mapper = bytes[6] >> 4;
      
    // Byte 7:
    
      // iNES 2.0 detection:
      // Some ROMS contain garbage (text) in the bytes 7-15 of the header. To detect iNES 2.0 reliably, this procedure is recommended:
      // - If (byte 7 AND $0C) == $08, and the size encoded in bytes 4, 5 and 9 does not exceed the file size, then NES 2.0
      if(
        (bytes[7] & 0x0C) == 0x08
        &&
        bytes.length >
        (
          (PRG_ROM_banks + (bytes[9] & 0b1111) << 8) * 16 * 1024
          +
          (CHR_ROM_banks + (bytes[9] & 0b11110000) << 4) * 8 * 1024
        )
      ){
        iNES = 2;
      }
          
      // - If (byte 7 AND $0C) == $00, and bytes 12-15 are 0, then iNES
      else if((bytes[7] & 0x0C) == 0x00 && bytes[12] == 0 && bytes[13] == 0 && bytes[14] == 0 && bytes[15] == 0){
        iNES = 1;
      }
      
      // - Otherwise, archaic iNES
      else {
        iNES = 0;
      }
      
      // Bit 0: Vs. arcade system
      Vs = bytes[7] & 0b1;
      
      // Bit 1:
      // iNES 1.0: hint screen data (8KB, placed after CHR data), considered as an extra ROM bank to accommodate with iNES 2.0 format
      // iNES 2.0: PC-10 arcade system
      if((bytes[7] & 0b10) >> 1){
        if(iNES == 1){
          PC10 = 0;
        }
        else if(iNES == 2){
          PC10 = 1;
        }
      }
      else {
        PC10 = 0;
      }
      
      // Bits 4-7: Bits 4-7 of mapper number
      mapper += (bytes[7] & 0b11110000);
      
    // Byte 8
    
    // - iNES 1.0: Number of 8KB PRG-RAM banks (0 => add 1 bank for better compatibility).
    //  Without more info, it's consider it battery-backed. The size in bytes is kept, to accommodate with iNES 2.0 format
    // - iNES 2.0: Submapper (bits 0-4), bits 8-11 of mapper number (bits 5-8)
    if(iNES == 1){
      PRG_RAM_bytes_battery_backed = (bytes[8] || 1) * 8 * 1024;
      PRG_RAM_bytes_not_battery_backed = 0;
      submapper = 0;
    }
    else if(iNES == 2){
      submapper = bytes[8] & 0b1111;
      mapper += ((bytes[8] & 0b11110000) << 4);
    }
    
    // Byte 9:
    
    // - iNES 1.0: TV system (0: NTSC / 1: PAL). Do not rely blindly on this value if it's 0.
    // - iNES 2.0: bits 9-12 of CHR-ROM size (bits 0-3), bits 9-12 of PRG-ROM size (bits 4-7)
    if(iNES == 1){
      TV_system = (bytes[9] & 0b1) ? "PAL" : "NTSC ?";
      PAL = (bytes[9] & 0b1);
    }
    else if(iNES == 2){
      PRG_ROM_banks += ((bytes[9] & 0b1111) << 8);
      CHR_ROM_banks += ((bytes[9] & 0b1111) << 8);
    }
    
    // Byte 10:
    
    // iNES 2.0: PRG-RAM NOT battery-backed (bits 0-3) and battery-backed (bits 4-7)
    // In bytes 10 and 11, the 4-bit sizes (N) use a logarithmic scale. 0: 0 byte / 1-14: 128 * 2^N bytes / 15: reserved
    if(iNES == 2){
      var bits0_3 = (bytes[10] & 0b1111);
      var bits4_7 = (bytes[10] & 0b11110000) >> 4;
      
      PRG_RAM_bytes_not_battery_backed = bits0_3 ? 128 * 2 ^ bits0_3 : 0;
      PRG_RAM_bytes_battery_backed  = bits4_7 ? 128 * 2 ^ bits4_7 : 0;
    }
    
    // Byte 11:
    
    // - iNES 1.0: assume that the CHR-RAM bank (if any) is 8KB and battery-backed
    // - iNES 2.0: CHR-RAM NOT battery-backed (bits 0-3) and battery-backed (bits 4-7)
    if(iNES == 1 && CHR_RAM_banks == 1){
      CHR_RAM_bytes_not_battery_backed = 0;
      CHR_RAM_bytes_battery_backed  = 8 * 1024;
    }
    else if(iNES == 2){
      var bits0_3 = (bytes[11] & 0b1111);
      var bits4_7 = (bytes[11] & 0b11110000) >> 4;
      
      CHR_RAM_bytes_not_battery_backed = bits0_3 ? 128 * 2 ^ bits0_3 : 0;
      CHR_RAM_bytes_battery_backed  = bits4_7 ? 128 * 2 ^ bits4_7 : 0;
    }
    
    // Byte 12:
    
    // iNES 2.0: Bit 0: NTSC / PAL. Bit 1: both. Do not rely blindly on yhis value if it's 0.
    if(iNES == 2){
      TV_system = (bytes[12] & 0b1) ? "PAL" : "NTSC ?";
      PAL = (bytes[12] & 0b1);
      
      if((bytes[12] & 0b10) == 0b10){
        TV_system = "PAL + NTSC";
        PAL = 1;
      }
    }
    
    // Byte 13:
    
    // iNES 2.0: Vs. arcade system configuration: PPU mode (bits 0-4), Vs. mode (bits 4-7)
    // The following code just detects Vs. arcade.
    if(iNES == 2){
      Vs = bytes[13] ? 1 : 0;
    }
    
    // Byte 14:
    
    // iNES 2.0: amount of extra non-PRG/CHR ROM banks (bits 0-1)
    extra_ROM_banks = 0;
    if(iNES == 2){
      extra_ROM_banks = (bytes[14] & 0b11);
    }
    
    // It's not guaranteed that the ROM header contains information about the TV standard (NTSC/PAL) in bytes 9 and 12, but some extra hints exist:
    // - The filename can contain "(E)", "(EUR)" or "(Europe)" for PAL / "(U)", "(USA)", "(J)" or "(Japan)" for NTSC.
    // - The checksum of PRG-RAM and CHR-RAM (combined) can be looked for in a NES ROM database like NesCartDB (this is the most reliable approach).
    // Only the filename check is checked here, and overrides the TV system present in the header if something is found.
    if(/\(E\)|\(EUR\)|\(Europe\)/i.test(filename)){
      TV_system = "PAL";
    }
    else if(/\(U\)|\(USA\)|\(J\)|\(Japan\)/i.test(filename)){
      TV_system = "NTSC";
    }
    else if(/\(EU\)|\(World\)/i.test(filename)){
      TV_system = "PAL + NTSC";
    }

    // Init UI
    filename_info.innerHTML = filename;
    format_info.innerHTML = "iNES" + iNES + ".0" ;
    tv_standard_info.innerHTML = TV_system;
    mapper_info.innerHTML = mapper + (submapper ? "-" + submapper : "");
    prg_rom_banks_info.innerHTML = PRG_ROM_banks + " * 16KB";
    chr_rom_banks_info.innerHTML = CHR_ROM_banks + " * 8KB";
    prg_ram_banks_info.innerHTML = (PRG_RAM_bytes_not_battery_backed / 1024) + "KB + " + (PRG_RAM_bytes_battery_backed / 1024) + "KB";
    chr_ram_banks_info.innerHTML = (CHR_RAM_bytes_not_battery_backed / 1024) + "KB + " + (CHR_RAM_bytes_battery_backed / 1024) + "KB";
    vram_banks_info.innerHTML = mirroring == 0 ? "0KB" : mirroring == 1 ? "0KB" : "2KB";
    mirroring_info.innerHTML = mirroring == 0 ? "Horizontal" : mirroring == 1 ? "Vertical" : "4-screen";
    extra_rom_banks_info.innerHTML = extra_ROM_banks ? (extra_ROM_banks + " * 8KB") : 0;
    trainer_bank_info.innerHTML = trainer_bank ? "512B" : "No";
    arcade_info.innerHTML = Vs ? "Vs." : PC10 ? "PC-10" : "No";
    
    // Read the file's data
    var pointer = 16;
    
    // Pass the 512B trainer (if any)
    if(trainer_bank){
      pointer += 512;
    }
    
    // Extract 16KB PRG-ROM banks, and create two views for each (signed / unsigned bytes)
    PRG_ROM_buffer = [];
    PRG_ROM_signed = [];
    PRG_ROM = [];
    asm = [];
    for(i = 0; i < PRG_ROM_banks; i++){
      PRG_ROM_buffer[i] = new ArrayBuffer(16 * 1024);
      PRG_ROM_signed[i] = new Int8Array(PRG_ROM_buffer[i]);
      PRG_ROM[i] = new Uint8Array(PRG_ROM_buffer[i]);
      asm[i] = [];
      for(var j = 0; j < 16 * 1024; j++){
        PRG_ROM[i][j] = bytes[pointer];
        pointer++;
      }
    }
    
    // Extract 8KB CHR-ROM banks, and create one view for each (unsigned bytes)
    CHR_ROM_buffer = [];
    CHR_ROM = [];
    for(i = 0; i < CHR_ROM_banks; i++){
      CHR_ROM_buffer[i] = new ArrayBuffer(8 * 1024);
      CHR_ROM[i] = new Uint8Array(CHR_ROM_buffer[i]);
      for(var j = 0; j < 8 * 1024; j++){
        CHR_ROM[i][j] = bytes[pointer];
        pointer++;
      }
    }
  }
  
  // Other ROM file formats (not supported)
  else {
    gamepak_info.innerHTML = "Unknown ROM format";
  }
  
  // Init CPU
  // ========
  
  // CPU memory + 2 views (signed int / unsigned int)
  // (Only the first 32KB of the memory is initialized here, the rest will be accessible through the PRG-ROM banks)
  cpu_memory_buffer = new ArrayBuffer(32 * 1024);
  cpu_memory_signed = new Int8Array(cpu_memory_buffer);
  cpu_memory = new Uint8Array(cpu_memory_buffer);

  // Interrupt vectors:
  
    // NMI vector ($FFFA-$FFFB, big-endian)
    nmi_vector = (cpu_read(0xFFFB) << 8) + cpu_read(0xFFFA);
    
    // Reset vector, also used when the system starts ($FFFC-$FFFD, big-endian)
    reset_vector = (cpu_read(0xFFFD) << 8) + cpu_read(0xFFFC);
    
    // IRQ/BRK vector ($FFFE-$FFFF, big-endian)
    irq_vector = (cpu_read(0xFFFF) << 8) + cpu_read(0xFFFE);
    
  // Registers:
  
    // Accumulator
    A = 0;
    
    // Index Registers
    X = 0;
    Y = 0;
    
    // Program Counter (points to the address in the reset vector)
    PC = reset_vector;
    
    // Stack pointer
    S = 0xFD;
    
    // Processor Status Register (Flags) - bit 5 is always 1.
    P = 0x34;
    
  // Flags (bits of P):
  
    // Carry (bit 0)
    C = 0;
    
    // Zero (bit 1)
    Z = 0;
    
    // IRQ disable (bit 2)
    // This bit is set on boot
    I = 1;
    
    // Decimal mode (bit 3)
    D = 0;
    
    // Break Flag (0 = IRQ/NMI, 1 = RESET/BRK/PHP) (bit 5)
    // This bit is set on boot
    B = 1;
    
    // Overflow (bit 6)
    V = 0;
    
    // Negative (bit 7)
    N = 0;
    
  // UI
  
  // TODO: update PRG-ROM bank numbers on bankswitch
  
  cpu_draw_internal_ram(S);
  cpu_draw_prg_ram();
  cpu_draw_prg_rom_low_page(PC);
  cpu_draw_prg_rom_high_page(PC);
  
  // UI
  nmi_vector_info.innerHTML = "$" + tools.format4(nmi_vector);
  reset_vector_info.innerHTML = "$" + tools.format4(reset_vector);
  irq_vectort_info.innerHTML = "$" + tools.format4(irq_vector);

  a_info.innerHTML = tools.format2(A);
  x_info.innerHTML = tools.format2(X);
  y_info.innerHTML = tools.format2(Y);
  pc_info.innerHTML = tools.format4(PC);
  s_info.innerHTML = tools.format2(S);
  p_info.innerHTML = tools.format2(P)
  
  c_info.innerHTML = C;
  z_info.innerHTML = Z;
  i_info.innerHTML = I;
  d_info.innerHTML = D;
  b_info.innerHTML = B;
  v_info.innerHTML = V;
  n_info.innerHTML = N;
  
  // Init PPU
  // ========
  
  ppu_cycles = 0;
  ppu_x = 0;
  ppu_y = 0;
  
  // PPU memory + 1 view (unsigned int)
  // (Only the first 16KB of the memory is initialized, the rest is mirrored)
  ppu_memory_buffer = new ArrayBuffer(16 * 1024);
  ppu_memory = new Uint8Array(ppu_memory_buffer);
  
  // OAM memory (256B) + 1 view (unsigned int)
  oam_memory_buffer = new ArrayBuffer(256);
  oam_memory = new Uint8Array(oam_memory_buffer);
  
  // Canvas
  screen_ctx = screen_canvas.getContext("2d");
    
  // UI
  // TODO: update PRG-ROM bank numbers on bankswitch
  
  // Pattern tables
  var html = "";

  for(i = 0x0000; i < 0x0005; i++){
    html += `<div id=ppu_byte_${i}>${tools.format4(i)}: ${tools.format2(ppu_read(i))}</div>`;
  }
  pattern_tables_info.innerHTML = html;
  
  // Name tables + attributes tables
  var html = "";

  for(i = 0x2000; i < 0x2005; i++){
    html += `<div id=ppu_byte_${i}>${tools.format4(i)}: ${tools.format2(ppu_read(i))}</div>`;
  }
  nametables_info.innerHTML = html;

  // Palettes
  var html = "";
  for(i = 0x3f00; i < 0x3f05; i++){
    html += `<div id=ppu_byte_${i}>${tools.format4(i)}: ${tools.format2(ppu_read(i))}</div>`;
  }

  palettes_info.innerHTML = html;
  
  // OAM
  var html = "";
  for(i = 0; i < 0x50; i += 4){
    html += `<div id=oam_${i}>${tools.format2(i)}: ${tools.format2(oam_memory[i])} ${tools.format2(oam_memory[i + 1])} ${tools.format2(oam_memory[i + 2])} ${tools.format2(oam_memory[i + 3])}</div>`;
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
  ppu_draw_tiles(0)
  ppu_draw_tiles(1)
  ppu_draw_nametables();
  ppu_draw_palettes();
  ppu_draw_screen();
}