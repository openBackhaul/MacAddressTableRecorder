# MacAddressTableRecorder  

### Location  
The MacAddressTableRecorder is part of the HighPerformanceNetworkInterface.  

### Description  
The MacAddressTableRecorder collects the current contents of the MAC address tables inside the microwave devices.  

It addresses all devices that can be accessed by the MicrowaveDeviceInventory, too.  
It implements a continuous cyclic operation for addressing the devices.  
The period length of the cyclic operation can be increased or decreased by configuring of the number of devices to be addressed in parallel.  
The readout process can be optimized by limiting the response time and the number of retries.  

An immediate readout can be triggered by calling a dedicated service.  
If address information of the requestor is contained in the call for an immediate readout, the collected data is send to the requestor (but no permanent OperationClient is created from the requestor's address information).  
Otherwise, just the ElasticSearch database is updated with the data from the device.  

Collected data is stored in an Elasticsearch database.  

MAC address information is made available as  
 - tables of all devices  
 - table of a specific device  
 - list of interfaces on a path to a specific MAC address  

The latter service is also available in generic representation.  

### Relevance  
The MacAddressTableRecorder provides routing information about all reachable microwave devices of the live network of Telefonica Germany.  
This information is needed to compute topology information about the physical connections in the network.  

### Resources  
- [Specification](./spec/)  
- [TestCaseCollection](./testing/)  
- [Implementation](./server/)  

### Dependencies  
- [MicroWaveDeviceInventory](https://github.com/openBackhaul/MicroWaveDeviceInventory)  

### Comments  
This application was specified during the ApplicationOwner training.  
