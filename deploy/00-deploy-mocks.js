const { network } = require("hardhat")
const {
    developmentChains,
    DECIMALS,
    INITITAL_ANSWER,
} = require("../helper-hardhat-config")

//pre-deploy-mocks
module.exports = async (hre) => {
    const { getNamedAccounts, deployments } = hre
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    if (developmentChains.includes(network.name)) {
        log("Local netowrk detected! Deploying mocks...")
        await deploy("MockV3Aggregator", {
            contract: "MockV3Aggregator",
            from: deployer,
            log: true,
            args: [DECIMALS, INITITAL_ANSWER],
        })
        log("Mocks Deployed...")
        log("---------------------------------------")
    }
}

/**
 * @TAGS :
 * ? command : "yarn hardhat deploy" will deploy all contracts in the order of number inside the deploy folder. So, deploy only specific contracts we use tags.
 * ? tags used to deploy only specific contracts.
 *
 * ? ex : if want to deploy only mock contract then use : "yarn hardhat deploy --tags mocks"
 */

module.exports.tags = ["all", "mocks"]
