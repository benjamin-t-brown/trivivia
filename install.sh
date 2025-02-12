#!/bin/bash

echo "Installing dependencies..."
yarn

echo "Installing server..."
cd server
yarn

echo "Installing client..."
cd ../client
yarn


