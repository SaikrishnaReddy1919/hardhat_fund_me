const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { network } = require("hardhat")

/**
 * @info :
 * ? hardhat-deploy automatically passes hre(hardhat runtime env) while using "yarn hardhat deploy" command
 */

module.exports = async (hre) => {
    const { getNamedAccounts, deployments } = hre
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    //if the contract for the ethUsdPrice is doesn't exist on some chain, then we deploy a minimal(mock) version the contract for our local testing
    //check file : 00-delpoy-mocks.js to see how we can deploy mocks.

    let ethUsdPriceFeedAddress
    if (developmentChains.includes(network.name)) {

        /**
         * @info : deployment on - local chains
         * ? here contract for the ethUsdPrice is doesn't exist, so we deployed mock one using 00-delpoy-mocks.js. Now we need the address of newly deployed mock contract address. To get that :
         * ? to get most recent deployment (address) using hardhat-deploy using name of the contract.
         * 
        */
        
        const ethUsdAggregator = await deployments.get("MockV3Aggregator")
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        // deployment on testnet chains
        ethUsdPriceFeedAddress - networkConfig[chainId]["ethUsdPriceFeed"]
    }

    const fundMeContract = await deploy("FundMe", {
        from: deployer,
        args: [ethUsdPriceFeedAddress], //constructor args
        log: true,
    })

    log("----------------------------")
}

/**
 * @info :
 * ? command : "yarn hardhat deploy" will deploy all contracts in the order of number inside the deploy folder. So, deploy only specific contracts we use tags.
 * ? tags used to deploy only specific contracts.
 *
 * ? ex : if want to deploy only fundme contract then use : "yarn hardhat deploy --tags fundme"
 */

module.exports.tags = ["all", "fundme"]
