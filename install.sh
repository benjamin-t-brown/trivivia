#!/bin/bash

echo "Installing dependencies..."
npm i

echo "Installing server..."
cd server
npm i

echo "Installing client..."
cd ../client
npm i