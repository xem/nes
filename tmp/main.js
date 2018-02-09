/** Main **/

// Open the ROM file
xhr = new XMLHttpRequest;
xhr.open('GET', "../zelda.nes");
xhr.responseType = 'arraybuffer';
xhr.send();
xhr.onload = function(){

  var i;

  // Save the ROM's binary content as an array of unsigned 8-bit integers
  file = new Uint8Array(xhr.response);

  // Read the ROM file header
  // First four bytes should be "NES\x1A" (not tested here)
  
  // Read the count of 16KiB blocks of game data
  rom16count = file[4] || 0x2000;
  
  // Read the count of 8KiB blocks of video data
  vrom8count = file[5] || 0x2000;
  
  // Reads byte of ROM flags, including half of the mapper number
  ctrlbyte = file[6];
  
  // Read more flags including the other half of the mapper number, which is shifted and OR'd with the previous read to construct the entire mapper number
  mappernum = file[7] | (ctrlbyte >> 4);

  // If the mapper number is over 63, then mask the first 4 bits and choose a mapper under 16
  if(mappernum >= 0x40){
    mappernum &= 15;
  }
  
  // Save the mapper number in GamePak for later reference
  GamePak_mappernum = mappernum;
  
  // Ignore bytes 8 to 15
  fp = 16;

  // Read the PRG ROM data
  GamePak_ROM = [];
  for(i = 0; i < rom16count * 0x4000; i++){
    GamePak_ROM[i] = file[i + 16];
  }
  
  // Read the CHR ROM data 
  GamePak_VRAM = [];
  for(i = 0; i < vrom8count * 0x2000; i++){
    GamePak_VRAM[i] = file[rom16count * 0x4000 + i + 16];
  }

  console.log(`${rom16count} * 16kB ROM, ${vrom8count} * 8kB VROM, mapper ${mappernum}, ctrlbyte ${ctrlbyte}`);

  // Start emulation
  // Initialize GamePak and memory
  //GamePak_Init();
  
  // Initialize IO (here, the canvas's context2d)
  c = a.getContext("2d");
  
  // Initialize PPU register
  PPU_reg.value = 0;

  // Pre-initialize RAM the same way as FCEUX does, to improve TAS sync.
  // (Set every group of 4 bytes to 0 or 255 alternatively)
  CPU_RAM = [];
  for(i = 0; i < 0x800; i++){
    CPU_RAM[i] = (i&4) ? 0xFF : 0x00;
  }
  
  // Run the CPU until the program is killed.
  //for(lol=0;lol<10;lol++){
    CPU_Op();
  //}
}