"""Patches a voice ONNX model with phoneme width alignment output.

Requires the onnx package to be installed (not onnxruntime).
"""

import argparse
import logging
from typing import Set

import onnx

_LOGGER = logging.getLogger(__name__)


def main() -> int:
    """Main entry point."""
    parser = argparse.ArgumentParser()
    parser.add_argument("model", help="Path to ONNX voice model")
    parser.add_argument(
        "--output", help="Path to write output model (default: overwrite)"
    )
    parser.add_argument(
        "--tensor-name", help="Name of tensor to mark as output (default: autodetect)"
    )
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO)

    if not args.output:
        # Overwrite
        args.output = args.model

    model = onnx.load(args.model)

    if args.tensor_name:
        ceil_tensor_name = args.tensor_name
    else:
        ceil_tensor_names: Set[str] = set()
        for node in model.graph.node:
            if node.op_type != "Ceil":
                continue

            ceil_tensor_names.update(node.output)

        if not ceil_tensor_names:
            _LOGGER.fatal("No ceil tensors detected. Use --tensor-name manually.")
            return 1

        if len(ceil_tensor_names) > 1:
            _LOGGER.fatal(
                "Multiple ceil tensors detected. Use --tensor-name manually: %s",
                ceil_tensor_names,
            )
            return 1

        ceil_tensor_name = next(iter(ceil_tensor_names))
        _LOGGER.info("Detected tensor name: %s", ceil_tensor_name)

    if any(output.name == ceil_tensor_name for output in model.graph.output):
        _LOGGER.fatal(
            "Tensor is already marked as output. Aborting: %s", ceil_tensor_name
        )
        return 1

    ceil_value_info = onnx.helper.ValueInfoProto()
    ceil_value_info.name = ceil_tensor_name
    model.graph.output.append(ceil_value_info)

    onnx.save(model, args.output)
    _LOGGER.info("Successfully wrote %s", args.output)

    return 0


if __name__ == "__main__":
    main()
