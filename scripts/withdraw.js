const { ethers, getNamedAccounts } = require("hardhat")

// ? Make sure the contract FundMe has deployed(on testnet) before running this test

async function main() {
  const { deployer } = await getNamedAccounts()
  const fundMe = await ethers.getContract("FundMe", deployer)
  console.log(`Got contract FundMe at ${fundMe.address}`)
  console.log("Withdrawing from contract...")
  const transactionResponse = await fundMe.withdraw()
  await transactionResponse.wait()
  console.log("Got it back!")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })