Delete this link at the end of the specification process:  
- [Roadmap to Specification](../../issues/1)

# MacAddressTableRecorder

### Location
The MacAddressTableRecorder is part of the HighPerformanceNetworkInterface.

### Description
_Copy from Roadmap:_
The MacAddressTableRecorder is continuously going through the devices of the MicroWaveDeviceInventory and addresses the RPC for uploading the content of the MAC address table. Received content is stored in an internal database. The MacAddressTableRecorder shall continuously operate in the background like a sanitation function.
_Original Text:_
- This application provides cached MAC address table content
- The MacAddressTableRecorder is continuously going through the devices of the MicroWaveDeviceInventory and addresses the RPC for uploading the content of the MAC address table
- Received content is stored in an internal database
- The MacAddressTableRecorder shall continuously operate in the background like a sanitation function
- It is a precondition for other applications assessing MAC address information

### Relevance
The MacAddressTableRecorder holds a fraction of the inventory of the live network at Telefonica Germany.  
As such, it is more close to be a component of the controller than of the application layer.


### Resources
- [Specification](./spec/)
- [TestSuite](./testing/)
- [Implementation](./server/)

### Comments
This application will be specified during training for ApplicationOwner.
