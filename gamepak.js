// Namespace

gamepak = {
  
  // Settings
  TV_system: 0,
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
  trainer_buffer: null,
  trainer_signed: null,
  trainer: null,
  
  PRG_ROM_buffer: [],
  PRG_ROM_signed: [],
  PRG_ROM: [],
  
  CHR_ROM_buffer: [],
  CHR_ROM: [],
  
  extra_ROM_buffer: [],
  extra_ROM_signed: [],
  extra_ROM: [],
  
  // ASM code for each PRG-ROM bank
  asm: [],
  
};

// Methods

// Parse a ROM picked with the file input
gamepak.parse_rom = function(file, filename){

  // Transform the file in an array of bytes
  var bytes = new Uint8Array(file.result);
  
  // Parse 16-byte iNES header (starts with bytes 4E 45 53 1A, file extension is generally ".nes")
  if(bytes[0] == 0x4E && bytes[1] == 0x45 && bytes[2] == 0x53 && bytes[3] == 0x1A){
  
    // Byte 4: Number of 16KB PRG-ROM banks 
    gamepak.PRG_ROM_banks = bytes[4];
    
    // Byte 5: Number of 8KB CHR-ROM banks (if 0 => use 1 CHR-RAM bank)
    gamepak.CHR_ROM_banks = bytes[5];
    gamepak.CHR_RAM_banks = gamepak.CHR_ROM_banks > 1 ? 0 : 1;
    
    // Byte 6:
    
      // Bit 0: Nametable mirroring (0 => horizontal / 1 => vertical)
      gamepak.mirroring = bytes[6] & 0b1;
      
      // Bit 1: Cartridge contains battery-backed PRG-RAM (CPU $6000-$7FFF)
      gamepak.PRG_RAM_banks = (bytes[6] & 0b10) >> 1;
      
      // Bit 2: Cartridge contains a 512B trainer (CPU $7000-$71FF)
      gamepak.trainer_bank = (bytes[6] & 0b100) >> 2;
      
      // Bit 3: Ignore mirroring in bit 0, use 4-screen nametable instead, the cartridge provides 2KB of VRAM.
      if((bytes[6] & 0b1000) >> 3){
        gamepak.mirroring = -1;
      }
      
      // Bits 4-7: Bits 0-3 of mapper number
      gamepak.mapper = bytes[6] >> 4;
      
    // Byte 7:
    
      // iNES 2.0 detection:
      // Some ROMS contain garbage (text) in the bytes 7-15 of the header. To detect iNES 2.0 reliably, this procedure is recommended:
      // - If (byte 7 AND $0C) == $08, and the size encoded in bytes 4, 5 and 9 does not exceed the file size, then NES 2.0
      if(
        (bytes[7] & 0x0C) == 0x08
        &&
        bytes.length >
        (
          (gamepak.PRG_ROM_banks + (bytes[9] & 0b1111) << 8) * 16 * 1024
          +
          (gamepak.CHR_ROM_banks + (bytes[9] & 0b11110000) << 4) * 8 * 1024
        )
      ){
        gamepak.iNES = 2;
      }
          
      // - If (byte 7 AND $0C) == $00, and bytes 12-15 are 0, then iNES
      else if((bytes[7] & 0x0C) == 0x00 && bytes[12] == 0 && bytes[13] == 0 && bytes[14] == 0 && bytes[15] == 0){
        gamepak.iNES = 1;
      }
      
      // - Otherwise, archaic iNES
      else {
        gamepak.iNES = 0;
      }
      
      // Bit 0: Vs. arcade system
      gamepak.Vs = bytes[7] & 0b1;
      
      // Bit 1:
      // iNES 1.0: hint screen data (8KB, placed after CHR data), considered as an extra ROM bank to accommodate with iNES 2.0 format
      // iNES 2.0: PC-10 arcade system
      if((bytes[7] & 0b10) >> 1){
        if(gamepak.iNES == 1){
          gamepak.extra_ROM_banks = 1;
          gamepak.PC10 = 0;
        }
        else if(gamepak.iNES == 2){
          gamepak.PC10 = 1;
          gamepak.extra_ROM_banks = 0;
        }
      }
      else {
        gamepak.PC10 = 0;
        gamepak.extra_ROM_banks = 0;
      }
      
      // Bits 4-7: Bits 4-7 of mapper number
      gamepak.mapper += (bytes[7] & 0b11110000);
      
    // Byte 8
    
    // - iNES 1.0: Number of 8KB PRG-RAM banks (0 => add 1 bank for better compatibility).
    //  Without more info, it's consider it battery-backed. The size in bytes is kept, to accommodate with iNES 2.0 format
    // - iNES 2.0: Submapper (bits 0-4), bits 8-11 of mapper number (bits 5-8)
    if(gamepak.iNES == 1){
      gamepak.PRG_RAM_bytes_battery_backed = (bytes[8] || 1) * 8 * 1024;
      gamepak.PRG_RAM_bytes_not_battery_backed = 0;
      gamepak.submapper = 0;
    }
    else if(gamepak.iNES == 2){
      gamepak.submapper = bytes[8] & 0b1111;
      gamepak.mapper += ((bytes[8] & 0b11110000) << 4);
    }
    
    // Byte 9:
    
    // - iNES 1.0: TV system (0: NTSC / 1: PAL). Do not rely blindly on this value if it's 0.
    // - iNES 2.0: bits 9-12 of CHR-ROM size (bits 0-3), bits 9-12 of PRG-ROM size (bits 4-7)
    if(gamepak.iNES == 1){
      gamepak.TV_system = (bytes[9] & 0b1) ? "PAL" : "NTSC ?";
    }
    else if(gamepak.iNES == 2){
      gamepak.PRG_ROM_banks += ((bytes[9] & 0b1111) << 8);
      gamepak.CHR_ROM_banks += ((bytes[9] & 0b1111) << 8);
    }
    
    // Byte 10:
    // iNES 2.0: PRG-RAM NOT battery-backed (bits 0-3) and battery-backed (bits 4-7)
    // In bytes 10 and 11, the 4-bit sizes (N) use a logarithmic scale. 0: 0 byte / 1-14: 128 * 2^N bytes / 15: reserved
    if(gamepak.iNES == 2){
      var bits0_3 = (bytes[10] & 0b1111);
      var bits4_7 = (bytes[10] & 0b11110000) >> 4;
      
      gamepak.PRG_RAM_bytes_not_battery_backed = bits0_3 ? 128 * 2 ^ bits0_3 : 0;
      gamepak.PRG_RAM_bytes_battery_backed  = bits4_7 ? 128 * 2 ^ bits4_7 : 0;
    }
    
    // Byte 11:
    // - iNES 1.0: assume that the CHR-RAM bank (if any) is 8KB and battery-backed
    // - iNES 2.0: CHR-RAM NOT battery-backed (bits 0-3) and battery-backed (bits 4-7)
    if(gamepak.iNES == 1 && gamepak.CHR_RAM_banks == 1){
      gamepak.CHR_RAM_bytes_not_battery_backed = 0;
      gamepak.CHR_RAM_bytes_battery_backed  = 8 * 1024;
    }
    else if(gamepak.iNES == 2){
      var bits0_3 = (bytes[11] & 0b1111);
      var bits4_7 = (bytes[11] & 0b11110000) >> 4;
      
      gamepak.CHR_RAM_bytes_not_battery_backed = bits0_3 ? 128 * 2 ^ bits0_3 : 0;
      gamepak.CHR_RAM_bytes_battery_backed  = bits4_7 ? 128 * 2 ^ bits4_7 : 0;
    }
    
    // Byte 12:
    // iNES 2.0: Bit 0: NTSC / PAL. Bit 1: both. Do not rely blindly on yhis value if it's 0.
    if(gamepak.iNES == 2){
      gamepak.TV_system = (bytes[12] & 0b1) ? "PAL" : "NTSC ?";
      if((bytes[12] & 0b10) == 0b10){
        gamepak.TV_system = "PAL + NTSC";
      }
    }
    
    // Byte 13:
    // iNES 2.0: Vs. arcade system configuration: PPU mode (bits 0-4), Vs. mode (bits 4-7)
    // The following code just detects Vs. arcade.
    if(gamepak.iNES == 2){
      gamepak.Vs = bytes[13] ? 1 : 0;
    }
    
    // Byte 14:
    // iNES 2.0: amount of extra non-PRG/CHR ROM banks (bits 0-1)
    if(gamepak.iNES == 2){
      gamepak.extra_ROM_banks = (bytes[14] & 0b11);
    }
    
    // It's not guaranteed that the ROM header contains information about the TV standard (NTSC/PAL) in bytes 9 and 12, but some extra hints exist:
    // - The filename can contain "(E)", "(EUR)" or "(Europe)" for PAL / "(U)", "(USA)", "(J)" or "(Japan)" for NTSC.
    // - The checksum of PRG-RAM and CHR-RAM (combined) can be looked for in a NES ROM database like NesCartDB (this is the most reliable approach).
    // Only the filename check is checked here, and overlaps the TV system present in the header if something is found.
    if(/\(E\)|\(EUR\)|\(Europe\)/i.test(filename)){
      gamepak.TV_system = "PAL";
    }
    else if(/\(U\)|\(USA\)|\(J\)|\(Japan\)/i.test(filename)){
      gamepak.TV_system = "NTSC";
    }
    else if(/\(EU\)|\(World\)/i.test(filename)){
      gamepak.TV_system = "PAL + NTSC";
    }

    // UI
    filename_info.innerHTML = filename;
    format_info.innerHTML = "iNES" + gamepak.iNES + ".0" ;
    tv_standard_info.innerHTML = gamepak.TV_system;
    mapper_info.innerHTML = gamepak.mapper + (gamepak.submapper ? "-" + gamepak.submapper : "");
    prg_rom_banks_info.innerHTML = gamepak.PRG_ROM_banks + " * 16KB";
    chr_rom_banks_info.innerHTML = gamepak.CHR_ROM_banks + " * 8KB";
    prg_ram_banks_info.innerHTML = (gamepak.PRG_RAM_bytes_not_battery_backed / 1024) + "KB + " + (gamepak.PRG_RAM_bytes_battery_backed / 1024) + "KB";
    chr_ram_banks_info.innerHTML = (gamepak.CHR_RAM_bytes_not_battery_backed / 1024) + "KB + " + (gamepak.CHR_RAM_bytes_battery_backed / 1024) + "KB";
    vram_banks_info.innerHTML = gamepak.mirroring == 0 ? "0KB" : gamepak.mirroring == 1 ? "0KB" : "2KB";
    mirroring_info.innerHTML = gamepak.mirroring == 0 ? "Horizontal" : gamepak.mirroring == 1 ? "Vertical" : "4-screen";
    extra_rom_banks_info.innerHTML = gamepak.extra_ROM_banks ? (gamepak.extra_ROM_banks + " * 8KB") : 0;
    trainer_bank_info.innerHTML = gamepak.trainer_bank ? "512B" : "No";
    arcade_info.innerHTML = gamepak.Vs ? "Vs." : gamepak.PC10 ? "PC-10" : "No";
    
    // Read the file's data
    var pointer = 16;
    
    // Extract 512B trainer (if any), and create two views (signed / unsigned bytes)
    if(gamepak.trainer_bank){
      gamepak.trainer_buffer = new ArrayBuffer(512);
      gamepak.trainer_signed = new Int8Array(gamepak.trainer_buffer);
      gamepak.trainer = new Uint8Array(gamepak.trainer_buffer);
      
      for(var i = 0; i < 512; i++){
        gamepak.trainer[i] = bytes[pointer];
        pointer++;
      }
    }
    else {
      gamepak.trainer = [];
    }
    
    // Extract 16KB PRG-ROM banks, and create two views for each (signed / unsigned bytes)
    for(i = 0; i < gamepak.PRG_ROM_banks; i++){
      gamepak.PRG_ROM_buffer[i] = new ArrayBuffer(16 * 1024);
      gamepak.PRG_ROM_signed[i] = new Int8Array(gamepak.PRG_ROM_buffer[i]);
      gamepak.PRG_ROM[i] = new Uint8Array(gamepak.PRG_ROM_buffer[i]);
      gamepak.asm[i] = [];
      for(var j = 0; j < 16 * 1024; j++){
        gamepak.PRG_ROM[i][j] = bytes[pointer];
        pointer++;
      }
    }
    
    // Extract 8KB CHR-ROM banks, and create one view for each (unsigned bytes)
    for(i = 0; i < gamepak.CHR_ROM_banks; i++){
      gamepak.CHR_ROM_buffer[i] = new ArrayBuffer(8 * 1024);
      gamepak.CHR_ROM[i] = new Uint8Array(gamepak.CHR_ROM_buffer[i]);
      for(var j = 0; j < 8 * 1024; j++){
        gamepak.CHR_ROM[i][j] = bytes[pointer];
        pointer++;
      }
    }
    
    // Extract extra ROM banks (8KB), and create two views for each (signed / unsigned bytes)
    for(i = 0; i < gamepak.extra_ROM_banks; i++){
      gamepak.extra_ROM_buffer[i] = new ArrayBuffer(8 * 1024);
      gamepak.extra_ROM_signed[i] = new Int8Array(gamepak.extra_ROM_buffer[i]);
      gamepak.extra_ROM[i] = new Uint8Array(gamepak.extra_ROM_buffer[i]);
      for(var j = 0; j < 8 * 1024; j++){
        gamepak.extra_ROM[i][j] = bytes[pointer];
        pointer++;
      }
    }
  }
  
  // Other ROM file formats (currently not supported)
  else {
    gamepak_info.innerHTML = "Unsupported ROM format";
  }
}