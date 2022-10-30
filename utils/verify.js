async function verify(contractAddress, args) {
    //args -> if contract has any args in constructor
    console.log("Verifying contract...")
    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: args,
        })
    } catch (error) {
        if (e.message.toLowerCase().includes("already verified")) {
            console.log("Already verified.")
        } else {
            console.log("Error while verifying : ", e)
        }
    }
}

module.exports = {
    verify,
}
