
# DriveNet-App
 
<a id="top"></a>


![DriveNet-App](images/drivenet-ui.png)

## Introduction

DriveNet-App is a front-end application for *DriveNet*, a demonstration Hyperledger Fabric blockchain network that allows users to submit transactions that modify car records. It is based on the enhanced [fabcar smart contract](https://github.com/FabNetworks/fabcar-advanced).

---

## Using DriveNet-App

To see the DriveNet-App in action, it is usually simplest to join an instance of the DriveNet network using the registry at [fabnetworks.org](https://fabnetworks.org). Once you have joined the network, you will be given a URL for your DriveNet-App instance.

Log on to the DriveNet-App using credentials supplied to you as part of the joining process. Then you can use the UI to browse the ledger, and create, delete and modify car records.


---

## Installing DriveNet-App

In order to install and run DriveNet-App on [OCP](https://www.openshift.com/products/container-platform):

1. Run `git clone` to create a local copy of your repo.

2. Run `npm install` to install pre-requisites.

3. Copy a valid IBP conection profile for your DriveNet network into the root of your repo (alongside `package.json`) and call the file `drivenet-gateway.json`. This is the network that the DriveNet-App will connect to.

4. run `npm run build` to make sure you can build the repo.

5. Log into your OCP cluster.

6. In the root of your repo, create a file called `.env` that is based on [.sample.env](.sample.env).

7. Modify the following values in the file: 

```
# JWT settings
SIGNING_SECRET="your secret"

# Wallet settings
HASH_SALT="your-salt"
```

where the values are random sequences of characters. The value of *SIGNING_SECRET* is used for signing tokens sent with API calls; *HASH_SALT* is used to produce hash-values for the application.

8. Save the file.

9. Create a new OCP project:

```
oc new-project drivenet
oc project drivenet
```

10. Create the credentials:

```
oc create secret generic drivenetcredentials --from-env-file .env
```

(To redeploy credentials in the future, run *oc delete secret drivenetcredentials* and then re-run the create command).

11. Deploy the DriveNet UI to your cluster:

```
npm run nodeshift
```

---

## Contact

If you have any questions or suggestions on the DriveNet-App, please contact blockchain@uk.ibm.com.


---
<sup>[_back to top_](#top)</sup>
