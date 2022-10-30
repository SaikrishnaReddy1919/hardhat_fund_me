
// @info: hardhat-deploy automatically passes hre(hardhat runtime env) while using "yarn hardhat deploy" command
module.exports = async (hre) => {
    const { getNamedAccounts, deployments } = hre
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    const fundMeContract = await deploy("FundMe", {
        from: deployer,
        args: [], //constructor args
        log : true
    })
}
