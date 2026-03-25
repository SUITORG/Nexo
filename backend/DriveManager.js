/**
 * 📁 DRIVE MANAGER - SUITORG MULTI-TENANT (v2.0.0)
 */
const DriveManager = {
  initDriveStructure: (idEmpresa) => {
    try {
      const rootId = CONFIG.DRIVE_ROOT_ID;
      const rootFolder = DriveApp.getFolderById(rootId);
      const coId = idEmpresa ? idEmpresa.trim().toUpperCase() : "GLOBAL";

      if (coId.includes("CMARJAV")) {
        const masterFolder = rootFolder; 
        DriveManager._getOrCreateFolder(masterFolder, "01_CLIENTES");
        DriveManager._getOrCreateFolder(masterFolder, "02_PENSIONES");
        const loanFolder = DriveManager._getOrCreateFolder(masterFolder, "03_PRESTAMOS");
        DriveManager._getOrCreateFolder(loanFolder, "00_FORMATOS_CONTRATOS");
        DriveManager._getOrCreateFolder(masterFolder, "04_MANUALES_Y_LEYES");
        const mktFolder = DriveManager._getOrCreateFolder(masterFolder, "05_PUBLICIDAD_Y_DISENO");
        DriveManager._getOrCreateFolder(mktFolder, "00_BIBLIOTECA_IA"); 
        return { success: true, message: "Bóveda CMARJAV sincronizada." };
      }
      return { success: false, error: "Empresa no reconocida." };
    } catch (e) { return { success: false, error: e.message }; }
  },
  _getOrCreateFolder: (parent, name) => {
    const it = parent.getFoldersByName(name);
    return it.hasNext() ? it.next() : parent.createFolder(name);
  }
};
