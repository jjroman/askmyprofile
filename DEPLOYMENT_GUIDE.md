# 🚀 Simple Deployment Guide

Follow these steps to deploy your interactive profile to Azure.

---

## ⏱️ Time Required: 30-45 minutes

---

## Step 1: Get Azure Account (5 min)

1. Go to https://azure.microsoft.com/free/
2. Click "Start free"
3. Sign in with Microsoft account (or create one)
4. Add credit card (won't be charged, just for verification)
5. Complete signup

**✅ You now have:** $200 free credit + free tier services

---

## Step 2: Install Azure CLI (5 min)

### macOS:
```bash
brew install azure-cli
```

### Windows:
Download from: https://aka.ms/installazurecliwindows

### Linux:
```bash
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

### Verify installation:
```bash
az --version
```

---

## Step 3: Install Node.js (if not installed)

Check if you have it:
```bash
node --version
```

If not, download from: https://nodejs.org/ (get LTS version)

---

## Step 4: Prepare Your Project (5 min)

```bash
# Extract the project files
cd /path/to/javier-profile-web

# Install dependencies
cd api
npm install
cd ..
```

---

## Step 5: Login to Azure (2 min)

```bash
az login
```

This opens a browser - sign in with your Azure account.

---

## Step 6: Deploy to Azure (10 min)

### 6a. Install Static Web Apps CLI:
```bash
npm install -g @azure/static-web-apps-cli
```

### 6b. Initialize (first time only):
```bash
swa init
```

When prompted:
- App location: `public`
- API location: `api`
- Output location: (leave empty, press Enter)

### 6c. Deploy:
```bash
swa deploy --app-location ./public --api-location ./api --deployment-token YOUR_DEPLOYMENT_TOKEN
```

**Wait, we need the deployment token first!**

---

## Step 7: Create Static Web App in Azure Portal (10 min)

**Easier way - use Azure Portal:**

1. Go to https://portal.azure.com
2. Click "Create a resource"
3. Search for "Static Web App"
4. Click "Create"

**Fill in:**
- **Resource Group:** Create new → "javier-profile-rg"
- **Name:** "javier-profile" (or your choice)
- **Plan type:** "Free"
- **Region:** "East US 2" (or closest to you)
- **Deployment details:**
  - Source: "Other"
  - Click "Review + create"
- Click "Create"

**Wait 1-2 minutes for deployment...**

---

## Step 8: Get Deployment Token (2 min)

1. Once created, go to your Static Web App
2. Click "Overview" in left menu
3. Click "Manage deployment token" at top
4. Copy the token (long string starting with...)
5. Save it somewhere safe

---

## Step 9: Deploy Your Code (5 min)

Now run this (replace with your token):

```bash
swa deploy \
  --app-location ./public \
  --api-location ./api \
  --deployment-token YOUR_COPIED_TOKEN_HERE
```

**Wait for deployment (~3-5 minutes)...**

You'll see: "✔ Project deployed to https://xxxxx.azurestaticapps.net"

---

## Step 10: Add Your API Key (3 min)

1. Go back to Azure Portal
2. Your Static Web App → "Configuration" in left menu
3. Click "+ Add"
4. Name: `ANTHROPIC_API_KEY`
5. Value: (paste your Anthropic API key)
6. Click "OK"
7. Click "Save" at top

---

## Step 11: Add Your Profile (5 min)

You have two options:

### Option A: Simple (embed in code)

1. Open `api/src/functions/chat.js`
2. Find the `PROFILE_PROMPT` constant
3. Replace it with your complete profile from `javier_profile_prompt.md`
4. Save and redeploy:
   ```bash
   swa deploy --app-location ./public --api-location ./api --deployment-token YOUR_TOKEN
   ```

### Option B: Advanced (environment variable)

This keeps code clean but is more complex. Skip for now, use Option A.

---

## Step 12: Test It! (2 min)

1. Go to your URL: `https://xxxxx.azurestaticapps.net`
2. Try asking: "Tell me about Javier's MCP experience"
3. You should get a detailed answer!

---

## ✅ Success Checklist

- [ ] Can visit your URL
- [ ] Chat interface loads
- [ ] Can type a question
- [ ] Get a response from Claude
- [ ] Response is about you (not generic)

---

## 🐛 If Something's Wrong:

### Problem: "API error" message

**Solution:**
```bash
# Check if API key is set
az staticwebapp appsettings list \
  --name javier-profile \
  --resource-group javier-profile-rg
```

If not showing your API key, add it again in Azure Portal.

### Problem: Generic responses

**Solution:** Your profile isn't loaded. Use Option A above to embed it in the code.

### Problem: Can't deploy

**Solution:** Check your deployment token is correct and not expired.

---

## 💰 Cost Check

After deployment, check you're in free tier:

1. Azure Portal → your Static Web App
2. Click "Pricing tier"
3. Should say "Free"

**Expected monthly cost:** $0 (Azure) + ~$0.30 (Claude API) = **$0.30 total**

---

## 🎉 You're Done!

Your URL is now ready to share:
- Put it in your cover letter
- Share with recruiters
- Test it yourself first!

---

## 📝 Next Steps:

1. Test thoroughly (ask 10-20 different questions)
2. Check responses are accurate and detailed
3. Update footer links in `public/index.html`
4. Customize suggested questions
5. Add to your cover letter

---

## 🆘 Need Help?

**Common issues:**
1. "Command not found" → Install missing tool
2. "Authentication failed" → Run `az login` again
3. "Deployment failed" → Check deployment token
4. "API not working" → Verify API key in Configuration

**Still stuck?** Check the full README.md for detailed troubleshooting.

---

**Good luck! 🚀**
