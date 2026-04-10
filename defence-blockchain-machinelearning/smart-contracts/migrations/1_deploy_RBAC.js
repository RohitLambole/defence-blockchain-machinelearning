const RBAC = artifacts.require("RBAC");
const AmmunitionAsset = artifacts.require("AmmunitionAsset");

module.exports = function (deployer) {
    deployer.deploy(RBAC).then(function() {
        return deployer.deploy(AmmunitionAsset, RBAC.address);
    });
};
