# Ultimate Value Finder & eBay Lister

A full-stack app to identify donated items with Gemini Vision and fetch sold/completed eBay pricing using the RapidAPI “eBay Average Selling Price” endpoint.  
Includes a beautiful React + Tailwind UI with eBay listing builder.

## Quick Start

```bash
# 1) Build from allcode
python build.py

# 2) Create .env files
cp .env.example .env
cp ui/.env.example ui/.env

# 3) Install dependencies
npm install
cd ui && npm install && cd ..

# 4) Start both
npm run dev

* Frontend: [http://localhost:5173](http://localhost:5173)
* Backend:  [http://localhost:4000](http://localhost:4000)