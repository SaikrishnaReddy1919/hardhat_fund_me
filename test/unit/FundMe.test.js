const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts } = require("hardhat")

describe("FundMe", async function () {
    let fundMe, deployer, mockV3Aggregator

    const sendValue = ethers.utils.parseEther("1") //1eth
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
            const response = await fundMe.priceFeed() // priceFeed : is the public variable in the contract. So by calling it we can fetch the address of the contract.
            assert.equal(response, mockV3Aggregator.address)
        })
    })

    describe("fund", async function () {
        it("fails if we dont send enough eth", async function () {
            // await fundMe.fund()
            await expect(fundMe.fund()).to.be.revertedWith(
                "didn't send enough funds!." //error mentioned in contract's fund() functions
            )
        })

        it("updates the amount funded data structure", async function () {
            await fundMe.fund({ value: sendValue })
            const response = await fundMe.addressToAmountFounded(deployer)
            assert.equal(response.toString(), sendValue.toString())
        })

        it("Adds the funder to funders array", async function () {
            await fundMe.fund({ value: sendValue })
            const funder = await fundMe.funders(0) //check the first index -> should be the deployer
            assert.equal(funder, deployer)
        })
    })

    describe("withdraw", async function () {
        beforeEach(async function () {
            await fundMe.fund({ value: sendValue })
        })
        it("withdraw ETH from a single founder", async function () {
            // arrange
            const startingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const startingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )

            //act
            const txnResponse = await fundMe.withdraw()
            const txnReceipt = await txnResponse.wait(1) //debug txnREceipt to check which other fields are available on txnReceipt
            const { gasUsed, effectiveGasPrice } = txnReceipt

            const gasCost = gasUsed.mul(effectiveGasPrice)

            const endingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const endingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )

            //assert
            // we need gasCost here. Caz in the above fund() function some balance from the deployer account is used for gas. We need to fetch how much that is and use it below to get exaclty the correct balance for the deployer
            assert.equal(endingFundMeBalance, 0)
            assert.equal(
                startingFundMeBalance.add(startingDeployerBalance).toString(),
                endingDeployerBalance.add(gasCost).toString()
            )
        })

        it("allows us to withdraw with multiple funders", async function () {
            //arrange
            const accounts = await ethers.getSigners()
            for (let i = 1; i < 6; i++) {
                const fundMeConnectedContract = await fundMe.connect(
                    accounts[i]
                )
                await fundMeConnectedContract.fund({ value: sendValue })
            }

            const startingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const startingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )

            //act
            const txnResponse = await fundMe.withdraw()
            const txnReceipt = await txnResponse.wait(1) //debug txnREceipt to check which other fields are available on txnReceipt
            const { gasUsed, effectiveGasPrice } = txnReceipt

            const gasCost = gasUsed.mul(effectiveGasPrice)

            const endingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const endingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )

            //assert
            assert.equal(endingFundMeBalance, 0)
            assert.equal(
                startingFundMeBalance.add(startingDeployerBalance).toString(),
                endingDeployerBalance.add(gasCost).toString()
            )
            await expect(fundMe.funders(0)).to.be.reverted
            for (let i = 1; i < 6; i++) {
                assert.equal(
                    await fundMe.addressToAmountFounded(accounts[i].address),
                    0
                )
            }
        })

        it("Only owner should be able to withdraw", async function () {
            const accounts = await ethers.getSigners()
            const attacker = accounts[1]
            const attackerConnectedContract = await fundMe.connect(attacker)
            await expect(
                attackerConnectedContract.withdraw()
            ).to.be.revertedWith("Only owner is allowed to call this.")
        })
    })
})
