import { ethers } from "ethers";
import { getLzChainInfo } from "./lzChainInfo";
import { getContract } from "../utils/evmChainsUtils";
import { IEstimateFee } from "../interfaces/IEstimateFee";
import { FeestimiError, ensureError } from "../errors";

const LzEndpointAbi = [
  "function estimateFees(uint16 _dstChainId, address _userApplication, bytes calldata _payload, bool _payInZRO, bytes calldata _adapterParams) external view returns (uint nativeFee, uint zroFee)",
];
const buildEstimateFee = () => {
  const estimateFee: IEstimateFee = async (
    fromChain,
    toChain,
    payload,
    fromDappAddress,
    _toDappAddress,
    _fundAddress,
    gasLimit,
  ) => {
    const fromAddress =
      fromDappAddress == undefined
        ? ethers.constants.AddressZero
        : fromDappAddress;
    console.log(`fromAddress: ${fromAddress}`);

    const fromChainInfo = getLzChainInfo(fromChain);
    const toChainInfo = getLzChainInfo(toChain);
    const lzEndpoint: ethers.Contract = await getContract(
      fromChain,
      LzEndpointAbi,
      fromChainInfo.lzEndpointAddress
    );

    try {
      const paramsStr = adapterParamsV1(gasLimit);
      const result = await lzEndpoint.estimateFees(
        toChainInfo.lzChainId,
        fromAddress,
        payload,
        false,
        paramsStr
      );

      return [result.nativeFee.toString(), paramsStr]
    } catch (e: any) {
      const err = ensureError(e);
      throw new FeestimiError(
        `Getting estimate gas fee from layerzero failed`,
        {
          cause: err,
        }
      );
    }
  };

  return estimateFee;
};

function adapterParamsV1(gasLimit: number) {
  return ethers.utils.solidityPack(["uint16", "uint256"], [1, gasLimit]);
}

export default buildEstimateFee;
