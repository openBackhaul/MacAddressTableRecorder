Delete this link at the end of the specification process:  
- [Roadmap to Specification](../../issues/1)

# MacAddressTableRecorder

### Location
The MacAddressTableRecorder is part of the HighPerformanceNetworkInterface.

### Description
The MacAddressTableRecorder addresses the microwave links of Telefonica Germany's live network in a round robin fashion and retrieves the contents of their MAC address tables. The received content is stored in an internal database and can be made available to other applications. On request the MacAddressTableRecorder also provides current content of the MAC address tables for a limited number of devices.

### Relevance
The MacAddressTableRecorder provides forwarding information for all microwave devices of Telefonica Germany's live network.  
This information is necessary to retrieve live network information about the physical connection of network devices.

### Resources
- [Specification](./spec/)
- [TestSuite](./testing/)
- [Implementation](./server/)

### Dependencies
- [MicroWaveDeviceInventory](https://github.com/openBackhaul/MicroWaveDeviceInventory)
- [Sequence-Id](https://github.com/openBackhaul/equipment/issues/25)

### Comments
This application will be specified during [training for ApplicationOwners](https://gist.github.com/openBackhaul/5aabdbc90257b83b9fe7fc4da059d3cd).
