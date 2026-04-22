#!/bin/bash
set -e
cd /home/prajwal/Crowd-Funding

echo "=== Installing OpenZeppelin ==="
forge install OpenZeppelin/openzeppelin-contracts --no-commit 2>&1 || echo "OpenZeppelin already installed or error occurred"

echo ""
echo "=== Building ==="
forge build 2>&1

echo ""
echo "=== Running Tests ==="
forge test -vvv 2>&1

echo ""
echo "=== Gas Report ==="
forge test --gas-report 2>&1

echo ""
echo "=== Coverage ==="
forge coverage 2>&1

echo ""
echo "=== DONE ==="
