# EnterpriseProxyDetails
Enterprise Proxy configuration script for use with customers who use a MITM proxy to inspect traffic. Helps config NPM, Git, Yarn and Python

- Edit `SetEnterpriseProxyDetails.js` with customer information and the call the script by using the following command `node SetEnterpiseProxyDetails.js`
  - The reason PowerShell was not used was due to many enterprise customers including this one not allowing PowerShell execution without a certificate
