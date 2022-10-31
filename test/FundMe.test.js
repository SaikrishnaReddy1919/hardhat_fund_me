const { assert } = require("chai")
const { deployments, ethers, getNamedAccounts } = require("hardhat")

describe("FundMe", async function () {
    let fundMe, deployer, mockV3Aggregator
    beforeEach(async function () {
        // ? below line runs through the deploy folder and deploys all the contracts with the mentioned tags. wow!!! Thanks to hardhat.

        deployer = (await getNamedAccounts()).deployer
        await deployments.fixture(["all"])

        /**
         * @deployer (owner) = is the account mentioned in the network in config file.
         * Ex : { accounts : [PRIVATE_KEY]}
         * If there are multiple accounts in the file, then to fetch single account use :
         *    const accounts = await ethers.getSigners() //fetchs all accounts.
         *    const accountZero = accounts[0] //can be used as deployer
         */
        fundMe = await ethers.getContract("FundMe", deployer) //fetchs most recent deployment
        mockV3Aggregator = await ethers.getContract(
            "MockV3Aggregator",
            deployer
        )
    })
    describe("constructor", async function () {
        it("sets the aggregator addresses correclty", async function () {
          const response = await fundMe.priceFeed()
          assert.equal(response, mockV3Aggregator.address)
        })
    })
})
