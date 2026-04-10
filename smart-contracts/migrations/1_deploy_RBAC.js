const RBAC  = aritfacts.require("RBAC")

module.exports = function (deployer) {
    deployer.deploy(RBAC);
};
