import fs from "fs";
import rimraf from "rimraf";
import path from "path";
const solc = require("solc");
import { camelize } from "@/utils/string-utils";
import getChainData from "@/utils/chain-utils";
import { fetchProjectByUUID } from "../launchpad/projects";

const project = {
  uuid: "85b06d17-20b9-484c-8728-558dcf4e59bc",
  version: 1,
  creator: "0xf85C8cc3c20E4324484977dD153dC33EC7f65f0c",
  chain: "Polygon mumbai",
  chainId: "80001",
  dropType: "tockable",
  name: "coolsi",
  description: "watashi wa cool des",
  website: "joob.com",
  twitter: "@joob",
  discord: "joobdis",
  slug: "joob-dis",
  image: "bafkreiafd6wfqfqaatyrnsouiogzfplbodrxfwcol35qmk5qrm5ovz4hym",
  cover: "bafkreictwrycv2bicwlibk6tmfj4dwy6ci65hxiagpqztpyriymvixaw2u",
  tokenName: "My Joob Token",
  tokenSymbol: "MJT",
  duplicateVerification: false,
  firstTokenId: 1,
  roles: [],
  sessions: [],
  signer: "0xe37BC49246A8D84910da330Ad9E95c97E53DDd24",
  contractAddress: "0xEB36e84cafD35398B1035a365F14A02dF9E251E2",
  layers: [],
  fileNames: [],
  cids: [],
  paused: true,
  activeSession: "",
  isDeployed: true,
  isPublished: false,
  isUnlimited: false,
  isVerified: false,
  totalSupply: "20",
};

function getContractName(_project) {
  return camelize(_project.name, true);
}

async function createCostimizedContractFile(
  _project,
  _buildDirectory,
  _contractName
) {
  const chainData = getChainData(Number(_project.chainId));
  const base_fee = Number(chainData.base_fee);
  const baseContract = fs.readFileSync(
    path.resolve(".", "contracts", "TockableDrop.sol"),
    "utf8"
  );
  let editedBaseContract = baseContract.replace(
    /string private constant CONTRACT_NAME = "Tockable";/g,
    `string private constant CONTRACT_NAME = "${_contractName}";`
  );
  editedBaseContract = editedBaseContract.replace(
    /string private constant TOKEN_NAME = "tockable";/g,
    `string private constant TOKEN_NAME = "${_project.tokenName}";`
  );
  editedBaseContract = editedBaseContract.replace(
    /string private constant TOKEN_SYMBOL = "TCKBLE";/g,
    `string private constant TOKEN_SYMBOL = "${_project.tokenSymbol}";`
  );
  editedBaseContract = editedBaseContract.replace(
    /uint256 public constant TOTAL_SUPPLY = 0;/g,
    `uint256 public constant TOTAL_SUPPLY = ${Number(_project.totalSupply)};`
  );
  editedBaseContract = editedBaseContract.replace(
    /uint256 private constant BASE_FEE = 0.0002 ether;/g,
    `uint256 private constant BASE_FEE = ${Number(base_fee)} ether;`
  );
  //   editedBaseContract = editedBaseContract.replace(
  //     /uint256 private constant FIRST_TOKEN_ID = 1;/g,
  //     `uint256 private constant FIRST_TOKEN_ID = ${Number(
  //       _project.firstTokenId
  //     )};`
  //   );
  if (
    _project.duplicateVerification === true ||
    _project.duplicateVerification === "true"
  ) {
    editedBaseContract = editedBaseContract.replace(
      /bool public constant duplicateVerification = false;/g,
      `bool public constant duplicateVerification = true;`
    );
  }

  if (_project.isUnlimited === true || _project.isUnlimited === "true") {
    editedBaseContract = editedBaseContract.replace(
      /bool public constant isUnlimited = false;/g,
      `bool public constant isUnlimited = true;`
    );
  }

  if (fs.existsSync(_buildDirectory)) {
    rimraf.sync(_buildDirectory);
    fs.mkdirSync(_buildDirectory);
  } else {
    fs.mkdirSync(_buildDirectory);
  }

  fs.writeFileSync(
    `${_buildDirectory}/${_contractName}.sol`,
    editedBaseContract
  );
}

function compile(_contractName, _project, _buildDirectory) {
  const sources = {};
  compileImports(sources, _project, _contractName, _buildDirectory);

  var input = {
    language: "Solidity",
    sources: sources,
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "london",
      remappings: [],
      outputSelection: {
        "*": {
          "*": [
            "evm.bytecode",
            "evm.deployedBytecode",
            "devdoc",
            "userdoc",
            "metadata",
            "abi",
          ],
        },
      },
    },
  };

  const output = solc.compile(JSON.stringify(input));
  const contract = JSON.parse(output);
  const metadata = {
    abi: contract.contracts[`${_contractName}.sol`]["TockableDrop"].abi,
    bytecode:
      contract.contracts[`${_contractName}.sol`]["TockableDrop"].evm.bytecode
        .object,
    deployedBytecode:
      contract.contracts[`${_contractName}.sol`]["TockableDrop"].evm
        .deployedBytecode.object,
  };

  return metadata;
}

function compileImports(sources, _project, _contractName, _buildDirectory) {
  sources[`${_contractName}.sol`] = {
    content: fs.readFileSync(
      path.resolve(_buildDirectory, `${_contractName}.sol`),
      "utf8"
    ),
  };
  const ownable = path.resolve(
    ".",
    "node_modules",
    "@openzeppelin/contracts/access/Ownable.sol"
  );
  sources["@openzeppelin/contracts/access/Ownable.sol"] = {
    content: fs.readFileSync(ownable, "utf8"),
  };

  const ierc721aQueryble = path.resolve(
    ".",
    "node_modules",
    "erc721a/contracts/extensions/IERC721AQueryable.sol"
  );
  sources["erc721a/contracts/extensions/IERC721AQueryable.sol"] = {
    content: fs.readFileSync(ierc721aQueryble, "utf8"),
  };

  const reentrancyGuard = path.resolve(
    ".",
    "node_modules",
    "@openzeppelin/contracts/utils/ReentrancyGuard.sol"
  );
  sources["@openzeppelin/contracts/utils/ReentrancyGuard.sol"] = {
    content: fs.readFileSync(reentrancyGuard, "utf8"),
  };

  const ecdsa = path.resolve(
    ".",
    "node_modules",
    "@openzeppelin/contracts/utils/cryptography/ECDSA.sol"
  );
  sources["@openzeppelin/contracts/utils/cryptography/ECDSA.sol"] = {
    content: fs.readFileSync(ecdsa, "utf8"),
  };

  const context = path.resolve(
    ".",
    "node_modules",
    "@openzeppelin/contracts/utils/Context.sol"
  );
  sources["@openzeppelin/contracts/utils/Context.sol"] = {
    content: fs.readFileSync(context, "utf8"),
  };

  const erc721aQueryble = path.resolve(
    ".",
    "node_modules",
    "erc721a/contracts/extensions/ERC721AQueryable.sol"
  );
  sources["erc721a/contracts/extensions/ERC721AQueryable.sol"] = {
    content: fs.readFileSync(erc721aQueryble, "utf8"),
  };

  const ierc721a = path.resolve(
    ".",
    "node_modules",
    "erc721a/contracts/IERC721A.sol"
  );
  sources["erc721a/contracts/IERC721A.sol"] = {
    content: fs.readFileSync(ierc721a, "utf8"),
  };

  const erc721a = path.resolve(
    ".",
    "node_modules",
    "erc721a/contracts/ERC721A.sol"
  );
  sources["erc721a/contracts/ERC721A.sol"] = {
    content: fs.readFileSync(erc721a, "utf8"),
  };
}

function writeOutput(_metadata, _project, _buildDirectory, _contractName) {
  fs.writeFileSync(
    path.resolve(_buildDirectory, _contractName + ".json"),
    JSON.stringify(_metadata)
  );
}

export async function createAndCompile(_creator, _uuid) {
  try {
    const contractName = getContractName(project);
    await createCostimizedContractFile(project, buildDirectory, contractName);
    const metadata = compile(contractName, project, buildDirectory);
    writeOutput(
      metadata,
      project,
      path.resolve(".", "z_bytecode/1.json"),
      contractName
    );
    return { success: true };
  } catch (err) {
    return { success: false };
  }
}
