const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("==================================================");
  console.log("   ChainProof: Deploying CertificateRegistry");
  console.log("==================================================");

  const [deployer, demoIssuer] = await hre.ethers.getSigners();
  console.log("Deployer (Admin) address:", deployer.address);
  console.log("Demo Issuer address:    ", demoIssuer.address);

  const CertificateRegistry = await hre.ethers.getContractFactory("CertificateRegistry");
  const registry = await CertificateRegistry.deploy();
  await registry.waitForDeployment();

  const contractAddress = await registry.getAddress();
  console.log(">>> CertificateRegistry deployed successfully to:", contractAddress);

  // Authorize demo issuer account for seamless local testing
  const institutionName = "Apex State University";
  console.log(`Authorizing Demo Issuer (${demoIssuer.address}) as '${institutionName}'...`);
  const authTx = await registry.authorizeIssuer(demoIssuer.address, institutionName);
  await authTx.wait();
  console.log("Demo Issuer authorized successfully!");

  // Extract and save contract artifact (address + ABI) for backend & frontend
  const artifactPath = path.join(__dirname, "../artifacts/contracts/CertificateRegistry.sol/CertificateRegistry.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const deploymentData = {
    contractAddress: contractAddress,
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    deployedAt: new Date().toISOString(),
    adminAddress: deployer.address,
    demoIssuerAddress: demoIssuer.address,
    abi: artifact.abi,
  };

  const outputFiles = [
    path.join(__dirname, "../deployed-address.json"),
    path.join(__dirname, "../../backend/deployed-contract.json"),
  ];

  for (const file of outputFiles) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(deploymentData, null, 2));
    console.log(`Wrote contract deployment info to: ${file}`);
  }

  console.log("Deployment completed successfully!");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
