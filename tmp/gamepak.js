/*
// GamePak
// The GamePak namespace provides functions supporting the NES ROM bootloader, including allocating, mapping, and accessing memory pages.
// Much of this namespace is incomplete, especially mapper writes. If your game of choice doesn't work, it's probably due to lack of mapper support.

// Declare vector containers for PRG ROM and 8KiB of CHR ROM that will be used to hold memory pages
ROM = [];
VRAM = []; // size: 0x2000

// Declare integer to hold the mapper id
mappernum = null;

// Fix page size of CHR ROM to 1KiB. then calculate total number of pages based on total memory size (8 Pages)
VROM_Granularity = 0x0400,
VROM_Pages = 0x2000 / VROM_Granularity;

// Fix page size of PRG ROM to 8KiB, then calculate total number of pages based on total memory size (8 Pages)
ROM_Granularity  = 0x2000,
ROM_Pages = 0x10000 / ROM_Granularity;

// Allocate 4KiB for four 1KiB nametables as NRAM and 8KiB for pattern tables as PRAM
NRAM = [], // size: 0x1000
PRAM = []; // size: 0x2000

// Pointer array to the base of the PRG ROM pages.
banks = [];

// Pointer array to the base of the CHR ROM pages.
Vbanks = [];

// Pointer array to the base of each 1KiB nametable.
Nta = [NRAM + 0x0000, NRAM + 0x0400, NRAM + 0x0000, NRAM + 0x0400];


// GamePak_SetPages constructs pointers to page base address within the memory vectors created earlier. The idea is that all actual data is stored within the vector and the memory banks provide pointers to successive "pages" within the vector. We do this for both PRG ROM (ROM) and CHR ROM (VRAM).
GamePak_SetPages = function(npages, b, r, granu, size, baseaddr, index){
  
  for(
    
    // Declare the loop that will set the page pointers in each bank to the underlying memory vector.
    // This ensures that memory (V)banks are properly mapped for general use.
    // v is set to an offset beyond the end of the vector, but it is later ringed to the vector.
    // The v definition could be reduced unless other functionality was intended for future use.
    var v = r.length + index * size,
    
    // Define p as the memory mapped page number in the banks
    p = baseaddr / granu;
    
    // Loop terminates when all pages are mapped. Both tests should be equivalent, but are checked just in case...?
    p < (baseaddr + size) / granu && p < npages;
    
    // Iterate both the current page and the page byte offset
    ++p, v += granu
  ){
    // Set the actual page pointer in to the underlying memory vector
    b[p] = r[v % r.length];
  }
}

// Declare the SetROM as a function pointer to the SetPages template using the PRG ROM as the underlying target
SetROM = function(size, baseaddr, index){
  GamePak_SetPages(ROM_Pages, banks, ROM, ROM_Granularity, size, baseaddr, index);
}

// Declare the SetVROM as a function pointer reference for the SetPages template using the CHR ROM as the underlying target
SetVROM = function(size, baseaddr, index){
  GamePak_SetPages(VROM_Pages, Vbanks, VRAM, VROM_Granularity, size, baseaddr, index);
}

*/

// GamePak_Access provides the interface to the memory pages and vectors defined earlier.
// It's one of the possible calls from MemAccess in the CPU namespace.
// Note that the game ROM has already been loaded in to the respective memory by the time this function is used.
// Right now, this function is working for read access, but write access is still only a framework for the common mappers.
// The function returns the byte value at the given address.
GamePak_Access = function(addr, value, write){
  
  console.log(addr.toString(16), value, write);
  
  /*
  // Check for writes to the GamePak with mapper 7
  if(write && addr >= 0x8000 && mappernum == 7){ // e.g. Rare games
    
    // Set the memory bank pointers with a 32KiB window
    SetROM(0x8000, 0x8000, (value & 7));
    
    // Match all nametable pointers to a selectable NRAM address based on 5th bit of an input value.
    // This is likely to support nametable mirroring specific to mapper 7.
    Nta[0] = Nta[1] = Nta[2] = Nta[3] = NRAM[0x400 * ((value >> 4) & 1)];
  }
  
  // Check for writes to the GamePak with mapper 2
  if(write && addr >= 0x8000 && mappernum == 2){ // e.g. Rockman, Castlevania
    
    // Set the memory bank pointers with a 16KiB window
    SetROM(0x4000, 0x8000, value);
  }
  
  // Check for writes to the GamePak with mapper 3
  if(write && addr >= 0x8000 && mappernum == 3){ // e.g. Kage, Solomon's Key
    
    // Calls access to the same address to set the value. For simulating a common bus conflict that exists in several mappers
    value &= Access(addr, 0, false); // Simulate bus conflict
    
    // Set the memory bank pointers with an 8KiB window
    SetVROM(0x2000, 0x0000, (value & 3));
  }
  
  // Check for writes to the GamePak with mapper 1. (still incomplete).
  if(write && addr >= 0x8000 && mappernum == 1){ // e.g. Rockman 2, Simon's Quest
  
    // Declare and define the four 5-bit registers used in the MMC1 chip.
    // Register 0 asserts bits 2 and 3 which uses low PRG ROM range (0x8000-0xBFFF) and 16KiB bank switching. This is the reset state of MMC1
    var regs = [0x0C, 0, 0, 0], counter = 0, cache = 0;
    
    configure = function(){
      
      // Clears the counter and the cache
      cache = counter = 0;
      
      // Creates 4x4 array of pattern matching bits for nametable management and mirroring
      var sel = [[0,0,0,0], [1,1,1,1], [0,1,0,1], [0,0,1,1]];
      
      // Iterates through the nametable pointers and sets their target memory addresses
      for(m = 0; m < 4; ++m){
        Nta[m] = NRAM[0x400 * sel[regs[0] & 3][m]];
      }
      
      // Sets CHR ROM pointer table
      SetVROM(0x1000, 0x0000, ((regs[0] & 16) ? regs[1] : ((regs[1] & ~1) + 0)));
      
      // Sets CHR ROM pointer table
      SetVROM(0x1000, 0x1000, ((regs[0] & 16) ? regs[2] : ((regs[1] & ~1) + 1)));
      
      // Checks the 2nd and 3rd bits of the control register. Bit 2 selects the memory range while bit 3 selects the memory width.
      switch((regs[0] >> 2) & 3){
        
        // If the control register is x00xx or x01xx
        case 0:
        case 1:
          
          // Map PRG ROM to a 32KiB bank starting at the low segment. Set value to the last register's bit 1,2,3 shifted down.
          SetROM(0x8000, 0x8000, (regs[3] & 0xE) / 2);
          break;
          
        // If the control register is x10xx
        case 2:
          
          // Map PRG ROM to 16KiB at the low address range
          SetROM(0x4000, 0x8000, 0);
          
          // Map PRG ROM to 16KiB at the high address range
          SetROM(0x4000, 0xC000, (regs[3] & 0xF));
          
          break;
        
        // If the control register is x11xx
        case 3:
        
          // Map PRG ROM to 16KiB at the low address range
          SetROM(0x4000, 0x8000, (regs[3] & 0xF));
          
          // Map PRG ROM to 16KiB at the high address range
          SetROM(0x4000, 0xC000, ~0);
          
          break;
      }
    }
    
    // Check bit 8 of the input value, which resets control registers and forces a reconfiguration
    if(value & 0x80){
      regs[0] = 0x0C;
      configure();
    }
    
    // Cache the input value's bit in the counter slot
    cache |= (value & 1) << counter;
    
    // Check if prefix incremented counter is 5 -- triggers every 5 write attempts.
    if(++counter == 5){
      
      // Cache and write the value to the a register based on the value of the top 2 address bits.
      // This simulates associative memory by locking certain address to certain registers.
      // The registers themselves are tied to specific memory blocks.
      regs[(addr >> 13) & 3] = value = cache;
      configure();
      
    }
  }
  
  // If access is in the Save RAM region (0x6000-0x7FFF) then return byte value remapped within PRAM
  if((addr >> 13) == 3){
    
    // Return PRG ROM mapped by the input address
    return PRAM[addr & 0x1FFF];
  }
  */
  
  //return banks[(addr / ROM_Granularity) % ROM_Pages][addr % ROM_Granularity];
  
  return 0;
}

// Initialize memory banks to valid pointer values
/*GamePak_Init = function(){
  
  // Set the CHR ROM Vbank pointers to a default value
  SetVROM(0x2000, 0x0000, 0);
  
  // Set the PRG ROM bank pointers to a default value
  for(v = 0; v < 4; ++v){
    SetROM(0x4000, v * 0x4000, v == 3 ? -1 : 0);
  }
}*/