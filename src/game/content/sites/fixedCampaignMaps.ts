/* eslint-disable max-lines -- Frozen authored map data stays inspectable as one campaign catalog. */
import type { CanonicalLevelId } from "../../types";
import type { WorldMap } from "../../world/map";

export const FIXED_CAMPAIGN_MAPS = {
  "harkers_brace": {
    "width": 132,
    "height": 34,
    "cellSize": 16,
    "ringRadii": {
      "inner": 22,
      "middle": 42
    },
    "coreAnchor": {
      "column": 118,
      "elevation": 12
    },
    "coreBreachCell": {
      "column": 107,
      "elevation": 4
    },
    "entryCell": {
      "column": 34,
      "elevation": 4
    },
    "routeGraph": {
      "coreNodeId": "core",
      "nodes": {
        "ingress:entry_to_core": {
          "id": "ingress:entry_to_core",
          "kind": "ingress",
          "cell": {
            "column": 34,
            "elevation": 4
          }
        },
        "core": {
          "id": "core",
          "kind": "core",
          "cell": {
            "column": 107,
            "elevation": 4
          }
        }
      },
      "edges": {},
      "routes": {
        "entry_to_core": {
          "id": "entry_to_core",
          "ingressNodeId": "ingress:entry_to_core",
          "edgeIds": [],
          "authoredOrder": 0
        }
      }
    },
    "rooms": {
      "washlock": {
        "id": "washlock",
        "code": "R-06",
        "structure": "room",
        "ambientTemperature": 22,
        "socketCount": 2,
        "bounds": {
          "column": 88,
          "elevation": 4,
          "width": 19,
          "height": 9
        },
        "socketCells": {
          "socket_a": {
            "column": 93,
            "elevation": 4
          },
          "socket_b": {
            "column": 103,
            "elevation": 4
          }
        },
        "platformCells": [],
        "ladderCells": [
          {
            "column": 97,
            "elevation": 4
          },
          {
            "column": 97,
            "elevation": 5
          },
          {
            "column": 97,
            "elevation": 6
          },
          {
            "column": 97,
            "elevation": 7
          },
          {
            "column": 97,
            "elevation": 8
          },
          {
            "column": 97,
            "elevation": 9
          },
          {
            "column": 97,
            "elevation": 10
          },
          {
            "column": 97,
            "elevation": 11
          },
          {
            "column": 97,
            "elevation": 12
          }
        ],
        "taps": {
          "gas": {
            "capacity": 18,
            "includeRoomInventory": false,
            "roomPortHeight": 0.72,
            "sourceIds": [
              "hazard_gas_reservoir"
            ]
          },
          "liquid": {
            "capacity": 20,
            "includeRoomInventory": false,
            "roomPortHeight": 0.12,
            "sourceIds": [
              "hazard_liquid_reservoir"
            ]
          }
        },
        "graftSlots": [
          {
            "id": "forward",
            "cell": {
              "column": 88,
              "elevation": 4
            },
            "facing": "left"
          },
          {
            "id": "upper",
            "cell": {
              "column": 97,
              "elevation": 12
            },
            "facing": "up"
          }
        ],
        "provenance": "hull"
      },
      "core": {
        "id": "core",
        "code": "CORE",
        "structure": "core",
        "ambientTemperature": 26,
        "socketCount": 0,
        "bounds": {
          "column": 109,
          "elevation": 4,
          "width": 18,
          "height": 16
        },
        "socketCells": {},
        "platformCells": [],
        "ladderCells": [],
        "taps": {
          "gas": {
            "capacity": 24,
            "includeRoomInventory": false,
            "roomPortHeight": 0.72,
            "sourceIds": [
              "gas_reservoir"
            ]
          },
          "liquid": {
            "capacity": 28,
            "includeRoomInventory": false,
            "roomPortHeight": 0.12,
            "sourceIds": [
              "liquid_reservoir_a",
              "liquid_reservoir_b"
            ]
          }
        },
        "graftSlots": [],
        "provenance": "hull"
      },
      "gallery": {
        "id": "gallery",
        "code": "HB-05",
        "structure": "room",
        "ambientTemperature": 22,
        "socketCount": 2,
        "bounds": {
          "column": 75,
          "elevation": 4,
          "width": 12,
          "height": 7
        },
        "socketCells": {
          "socket_a": {
            "column": 79,
            "elevation": 4
          },
          "socket_b": {
            "column": 83,
            "elevation": 4
          }
        },
        "platformCells": [],
        "ladderCells": [
          {
            "column": 80,
            "elevation": 4
          },
          {
            "column": 80,
            "elevation": 5
          },
          {
            "column": 80,
            "elevation": 6
          },
          {
            "column": 80,
            "elevation": 7
          },
          {
            "column": 80,
            "elevation": 8
          },
          {
            "column": 80,
            "elevation": 9
          },
          {
            "column": 80,
            "elevation": 10
          }
        ],
        "taps": {
          "gas": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.72,
            "sourceIds": []
          },
          "liquid": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.12,
            "sourceIds": []
          }
        },
        "graftSlots": [],
        "provenance": "site"
      },
      "furnace": {
        "id": "furnace",
        "code": "HB-04",
        "structure": "room",
        "ambientTemperature": 22,
        "socketCount": 2,
        "bounds": {
          "column": 73,
          "elevation": 12,
          "width": 14,
          "height": 9
        },
        "socketCells": {
          "socket_a": {
            "column": 77,
            "elevation": 12
          },
          "socket_b": {
            "column": 83,
            "elevation": 12
          }
        },
        "platformCells": [],
        "ladderCells": [
          {
            "column": 80,
            "elevation": 12
          },
          {
            "column": 80,
            "elevation": 13
          },
          {
            "column": 80,
            "elevation": 14
          },
          {
            "column": 80,
            "elevation": 15
          },
          {
            "column": 80,
            "elevation": 16
          },
          {
            "column": 80,
            "elevation": 17
          },
          {
            "column": 80,
            "elevation": 18
          },
          {
            "column": 80,
            "elevation": 19
          },
          {
            "column": 80,
            "elevation": 20
          }
        ],
        "taps": {
          "gas": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.72,
            "sourceIds": []
          },
          "liquid": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.12,
            "sourceIds": []
          }
        },
        "graftSlots": [],
        "provenance": "site"
      },
      "reservoir": {
        "id": "reservoir",
        "code": "HB-03",
        "structure": "room",
        "ambientTemperature": 22,
        "socketCount": 2,
        "bounds": {
          "column": 58,
          "elevation": 12,
          "width": 14,
          "height": 7
        },
        "socketCells": {
          "socket_a": {
            "column": 62,
            "elevation": 12
          },
          "socket_b": {
            "column": 68,
            "elevation": 12
          }
        },
        "platformCells": [],
        "ladderCells": [
          {
            "column": 64,
            "elevation": 12
          },
          {
            "column": 64,
            "elevation": 13
          },
          {
            "column": 64,
            "elevation": 14
          },
          {
            "column": 64,
            "elevation": 15
          },
          {
            "column": 64,
            "elevation": 16
          },
          {
            "column": 64,
            "elevation": 17
          },
          {
            "column": 64,
            "elevation": 18
          }
        ],
        "taps": {
          "gas": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.72,
            "sourceIds": []
          },
          "liquid": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.12,
            "sourceIds": []
          }
        },
        "graftSlots": [],
        "provenance": "site"
      },
      "lower_intake": {
        "id": "lower_intake",
        "code": "HB-02",
        "structure": "room",
        "ambientTemperature": 22,
        "socketCount": 2,
        "bounds": {
          "column": 58,
          "elevation": 4,
          "width": 14,
          "height": 7
        },
        "socketCells": {
          "socket_a": {
            "column": 62,
            "elevation": 4
          },
          "socket_b": {
            "column": 68,
            "elevation": 4
          }
        },
        "platformCells": [],
        "ladderCells": [
          {
            "column": 64,
            "elevation": 4
          },
          {
            "column": 64,
            "elevation": 5
          },
          {
            "column": 64,
            "elevation": 6
          },
          {
            "column": 64,
            "elevation": 7
          },
          {
            "column": 64,
            "elevation": 8
          },
          {
            "column": 64,
            "elevation": 9
          },
          {
            "column": 64,
            "elevation": 10
          }
        ],
        "taps": {
          "gas": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.72,
            "sourceIds": []
          },
          "liquid": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.12,
            "sourceIds": []
          }
        },
        "graftSlots": [],
        "provenance": "site"
      },
      "switchyard": {
        "id": "switchyard",
        "code": "HB-01",
        "structure": "room",
        "ambientTemperature": 22,
        "socketCount": 2,
        "bounds": {
          "column": 39,
          "elevation": 4,
          "width": 18,
          "height": 6
        },
        "socketCells": {
          "socket_a": {
            "column": 45,
            "elevation": 4
          },
          "socket_b": {
            "column": 51,
            "elevation": 4
          }
        },
        "platformCells": [],
        "ladderCells": [],
        "taps": {
          "gas": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.72,
            "sourceIds": []
          },
          "liquid": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.12,
            "sourceIds": []
          }
        },
        "graftSlots": [],
        "provenance": "site"
      },
      "west_intake": {
        "id": "west_intake",
        "code": "ENTRY",
        "structure": "entry",
        "ambientTemperature": 22,
        "socketCount": 0,
        "bounds": {
          "column": 34,
          "elevation": 4,
          "width": 4,
          "height": 6
        },
        "socketCells": {},
        "platformCells": [],
        "ladderCells": [],
        "taps": {
          "gas": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.72,
            "sourceIds": []
          },
          "liquid": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.12,
            "sourceIds": []
          }
        },
        "graftSlots": [],
        "provenance": "site"
      }
    },
    "connections": {
      "site_route_1:west_intake__switchyard": {
        "id": "site_route_1:west_intake__switchyard",
        "rooms": [
          "west_intake",
          "switchyard"
        ],
        "hostRoomId": "west_intake",
        "defaultOpen": true,
        "defaultSealed": false,
        "sealGroupId": "site_seal:site_route_1:west_intake__switchyard",
        "gasConductance": 0.22,
        "liquidConductance": 0.24,
        "aperture": 1,
        "kind": "passage",
        "connectorCells": [
          {
            "column": 38,
            "elevation": 4
          }
        ],
        "endpoints": [
          {
            "column": 37,
            "elevation": 4
          },
          {
            "column": 39,
            "elevation": 4
          }
        ],
        "orientation": "horizontal",
        "sillElevation": 4,
        "liquidMode": "spill"
      },
      "site_route_2:switchyard__lower_intake": {
        "id": "site_route_2:switchyard__lower_intake",
        "rooms": [
          "switchyard",
          "lower_intake"
        ],
        "hostRoomId": "switchyard",
        "defaultOpen": true,
        "defaultSealed": false,
        "sealGroupId": "site_seal:site_route_2:switchyard__lower_intake",
        "gasConductance": 0.22,
        "liquidConductance": 0.24,
        "aperture": 1,
        "kind": "passage",
        "connectorCells": [
          {
            "column": 57,
            "elevation": 4
          }
        ],
        "endpoints": [
          {
            "column": 56,
            "elevation": 4
          },
          {
            "column": 58,
            "elevation": 4
          }
        ],
        "orientation": "horizontal",
        "sillElevation": 4,
        "liquidMode": "spill"
      },
      "site_route_3:lower_intake__reservoir": {
        "id": "site_route_3:lower_intake__reservoir",
        "rooms": [
          "lower_intake",
          "reservoir"
        ],
        "hostRoomId": "lower_intake",
        "defaultOpen": true,
        "defaultSealed": false,
        "sealGroupId": "site_seal:site_route_3:lower_intake__reservoir",
        "gasConductance": 0.22,
        "liquidConductance": 0.24,
        "aperture": 1,
        "kind": "ladder_shaft",
        "connectorCells": [
          {
            "column": 64,
            "elevation": 11
          }
        ],
        "endpoints": [
          {
            "column": 64,
            "elevation": 10
          },
          {
            "column": 64,
            "elevation": 12
          }
        ],
        "orientation": "vertical",
        "sillElevation": 11,
        "liquidMode": "drain"
      },
      "site_route_4:reservoir__furnace": {
        "id": "site_route_4:reservoir__furnace",
        "rooms": [
          "reservoir",
          "furnace"
        ],
        "hostRoomId": "reservoir",
        "defaultOpen": true,
        "defaultSealed": false,
        "sealGroupId": "site_seal:site_route_4:reservoir__furnace",
        "gasConductance": 0.22,
        "liquidConductance": 0.24,
        "aperture": 1,
        "kind": "passage",
        "connectorCells": [
          {
            "column": 72,
            "elevation": 12
          }
        ],
        "endpoints": [
          {
            "column": 71,
            "elevation": 12
          },
          {
            "column": 73,
            "elevation": 12
          }
        ],
        "orientation": "horizontal",
        "sillElevation": 12,
        "liquidMode": "spill"
      },
      "site_route_5:furnace__gallery": {
        "id": "site_route_5:furnace__gallery",
        "rooms": [
          "furnace",
          "gallery"
        ],
        "hostRoomId": "gallery",
        "defaultOpen": true,
        "defaultSealed": false,
        "sealGroupId": "site_seal:site_route_5:furnace__gallery",
        "gasConductance": 0.22,
        "liquidConductance": 0.24,
        "aperture": 1,
        "kind": "ladder_shaft",
        "connectorCells": [
          {
            "column": 80,
            "elevation": 11
          }
        ],
        "endpoints": [
          {
            "column": 80,
            "elevation": 12
          },
          {
            "column": 80,
            "elevation": 10
          }
        ],
        "orientation": "vertical",
        "sillElevation": 11,
        "liquidMode": "drain"
      },
      "site_route_6:gallery__washlock": {
        "id": "site_route_6:gallery__washlock",
        "rooms": [
          "gallery",
          "washlock"
        ],
        "hostRoomId": "gallery",
        "defaultOpen": true,
        "defaultSealed": false,
        "sealGroupId": "site_seal:site_route_6:gallery__washlock",
        "gasConductance": 0.22,
        "liquidConductance": 0.24,
        "aperture": 1,
        "kind": "passage",
        "connectorCells": [
          {
            "column": 87,
            "elevation": 4
          }
        ],
        "endpoints": [
          {
            "column": 86,
            "elevation": 4
          },
          {
            "column": 88,
            "elevation": 4
          }
        ],
        "orientation": "horizontal",
        "sillElevation": 4,
        "liquidMode": "spill"
      },
      "washlock_to_core_door": {
        "id": "washlock_to_core_door",
        "kind": "core_door",
        "rooms": [
          "washlock",
          "core"
        ],
        "connectorCells": [
          {
            "column": 107,
            "elevation": 4
          },
          {
            "column": 108,
            "elevation": 4
          }
        ],
        "endpoints": [
          {
            "column": 106,
            "elevation": 4
          },
          {
            "column": 109,
            "elevation": 4
          }
        ],
        "orientation": "horizontal",
        "sillElevation": 4,
        "aperture": 2,
        "gasConductance": 0,
        "liquidConductance": 0,
        "liquidMode": "blocked",
        "hostRoomId": "washlock",
        "defaultOpen": false,
        "defaultSealed": true,
        "sealGroupId": null
      }
    },
    "utilityNodes": {
      "gas_reservoir": {
        "cell": {
          "column": 112,
          "elevation": 16
        },
        "hostRoomId": "core"
      },
      "hazard_gas_reservoir": {
        "cell": {
          "column": 91,
          "elevation": 6
        },
        "hostRoomId": "washlock"
      },
      "liquid_reservoir_a": {
        "cell": {
          "column": 112,
          "elevation": 6
        },
        "hostRoomId": "core"
      },
      "liquid_reservoir_b": {
        "cell": {
          "column": 116,
          "elevation": 6
        },
        "hostRoomId": "core"
      },
      "hazard_liquid_reservoir": {
        "cell": {
          "column": 100,
          "elevation": 6
        },
        "hostRoomId": "washlock"
      },
      "gas_vent": {
        "cell": {
          "column": 122,
          "elevation": 16
        },
        "hostRoomId": "core"
      },
      "liquid_drain": {
        "cell": {
          "column": 122,
          "elevation": 6
        },
        "hostRoomId": "core"
      }
    }
  },
  "kettleblack": {
    "width": 166,
    "height": 64,
    "cellSize": 16,
    "ringRadii": {
      "inner": 28,
      "middle": 54
    },
    "coreAnchor": {
      "column": 132,
      "elevation": 12
    },
    "coreBreachCell": {
      "column": 121,
      "elevation": 4
    },
    "entryCell": {
      "column": 7,
      "elevation": 4
    },
    "routeGraph": {
      "coreNodeId": "core",
      "nodes": {
        "ingress:entry_to_core": {
          "id": "ingress:entry_to_core",
          "kind": "ingress",
          "cell": {
            "column": 7,
            "elevation": 4
          }
        },
        "core": {
          "id": "core",
          "kind": "core",
          "cell": {
            "column": 121,
            "elevation": 4
          }
        }
      },
      "edges": {},
      "routes": {
        "entry_to_core": {
          "id": "entry_to_core",
          "ingressNodeId": "ingress:entry_to_core",
          "edgeIds": [],
          "authoredOrder": 0
        }
      }
    },
    "rooms": {
      "washlock": {
        "id": "washlock",
        "code": "R-06",
        "structure": "room",
        "ambientTemperature": 22,
        "socketCount": 2,
        "bounds": {
          "column": 102,
          "elevation": 4,
          "width": 19,
          "height": 9
        },
        "socketCells": {
          "socket_a": {
            "column": 107,
            "elevation": 4
          },
          "socket_b": {
            "column": 117,
            "elevation": 4
          }
        },
        "platformCells": [],
        "ladderCells": [
          {
            "column": 111,
            "elevation": 4
          },
          {
            "column": 111,
            "elevation": 5
          },
          {
            "column": 111,
            "elevation": 6
          },
          {
            "column": 111,
            "elevation": 7
          },
          {
            "column": 111,
            "elevation": 8
          },
          {
            "column": 111,
            "elevation": 9
          },
          {
            "column": 111,
            "elevation": 10
          },
          {
            "column": 111,
            "elevation": 11
          },
          {
            "column": 111,
            "elevation": 12
          }
        ],
        "taps": {
          "gas": {
            "capacity": 18,
            "includeRoomInventory": false,
            "roomPortHeight": 0.72,
            "sourceIds": [
              "hazard_gas_reservoir"
            ]
          },
          "liquid": {
            "capacity": 20,
            "includeRoomInventory": false,
            "roomPortHeight": 0.12,
            "sourceIds": [
              "hazard_liquid_reservoir"
            ]
          }
        },
        "graftSlots": [
          {
            "id": "forward",
            "cell": {
              "column": 102,
              "elevation": 4
            },
            "facing": "left"
          },
          {
            "id": "upper",
            "cell": {
              "column": 111,
              "elevation": 12
            },
            "facing": "up"
          }
        ],
        "provenance": "hull"
      },
      "core": {
        "id": "core",
        "code": "CORE",
        "structure": "core",
        "ambientTemperature": 26,
        "socketCount": 0,
        "bounds": {
          "column": 123,
          "elevation": 4,
          "width": 18,
          "height": 16
        },
        "socketCells": {},
        "platformCells": [],
        "ladderCells": [],
        "taps": {
          "gas": {
            "capacity": 24,
            "includeRoomInventory": false,
            "roomPortHeight": 0.72,
            "sourceIds": [
              "gas_reservoir"
            ]
          },
          "liquid": {
            "capacity": 28,
            "includeRoomInventory": false,
            "roomPortHeight": 0.12,
            "sourceIds": [
              "liquid_reservoir_a",
              "liquid_reservoir_b"
            ]
          }
        },
        "graftSlots": [],
        "provenance": "hull"
      },
      "lower_intake": {
        "id": "lower_intake",
        "code": "KB-05",
        "structure": "room",
        "ambientTemperature": 22,
        "socketCount": 2,
        "bounds": {
          "column": 84,
          "elevation": 4,
          "width": 17,
          "height": 9
        },
        "socketCells": {
          "socket_a": {
            "column": 89,
            "elevation": 4
          },
          "socket_b": {
            "column": 96,
            "elevation": 4
          }
        },
        "platformCells": [],
        "ladderCells": [],
        "taps": {
          "gas": {
            "capacity": 24,
            "includeRoomInventory": true,
            "roomPortHeight": 0.72,
            "sourceIds": []
          },
          "liquid": {
            "capacity": 20,
            "includeRoomInventory": true,
            "roomPortHeight": 0.12,
            "sourceIds": []
          }
        },
        "graftSlots": [],
        "provenance": "site"
      },
      "gallery": {
        "id": "gallery",
        "code": "KB-04",
        "structure": "room",
        "ambientTemperature": 22,
        "socketCount": 2,
        "bounds": {
          "column": 69,
          "elevation": 4,
          "width": 14,
          "height": 11
        },
        "socketCells": {
          "socket_a": {
            "column": 73,
            "elevation": 4
          },
          "socket_b": {
            "column": 79,
            "elevation": 4
          }
        },
        "platformCells": [],
        "ladderCells": [],
        "taps": {
          "gas": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.72,
            "sourceIds": []
          },
          "liquid": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.12,
            "sourceIds": []
          }
        },
        "graftSlots": [],
        "provenance": "site"
      },
      "reservoir": {
        "id": "reservoir",
        "code": "KB-03",
        "structure": "room",
        "ambientTemperature": 22,
        "socketCount": 2,
        "bounds": {
          "column": 48,
          "elevation": 4,
          "width": 20,
          "height": 10
        },
        "socketCells": {
          "socket_a": {
            "column": 54,
            "elevation": 4
          },
          "socket_b": {
            "column": 62,
            "elevation": 4
          }
        },
        "platformCells": [],
        "ladderCells": [],
        "taps": {
          "gas": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.72,
            "sourceIds": []
          },
          "liquid": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.12,
            "sourceIds": []
          }
        },
        "graftSlots": [],
        "provenance": "site"
      },
      "furnace": {
        "id": "furnace",
        "code": "KB-02",
        "structure": "room",
        "ambientTemperature": 22,
        "socketCount": 2,
        "bounds": {
          "column": 29,
          "elevation": 4,
          "width": 18,
          "height": 12
        },
        "socketCells": {
          "socket_a": {
            "column": 35,
            "elevation": 4
          },
          "socket_b": {
            "column": 41,
            "elevation": 4
          }
        },
        "platformCells": [],
        "ladderCells": [],
        "taps": {
          "gas": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.72,
            "sourceIds": []
          },
          "liquid": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.12,
            "sourceIds": []
          }
        },
        "graftSlots": [],
        "provenance": "site"
      },
      "switchyard": {
        "id": "switchyard",
        "code": "KB-01",
        "structure": "room",
        "ambientTemperature": 22,
        "socketCount": 2,
        "bounds": {
          "column": 12,
          "elevation": 4,
          "width": 16,
          "height": 9
        },
        "socketCells": {
          "socket_a": {
            "column": 17,
            "elevation": 4
          },
          "socket_b": {
            "column": 23,
            "elevation": 4
          }
        },
        "platformCells": [],
        "ladderCells": [],
        "taps": {
          "gas": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.72,
            "sourceIds": []
          },
          "liquid": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.12,
            "sourceIds": []
          }
        },
        "graftSlots": [],
        "provenance": "site"
      },
      "west_intake": {
        "id": "west_intake",
        "code": "KB-00",
        "structure": "entry",
        "ambientTemperature": 22,
        "socketCount": 0,
        "bounds": {
          "column": 7,
          "elevation": 4,
          "width": 4,
          "height": 8
        },
        "socketCells": {},
        "platformCells": [],
        "ladderCells": [],
        "taps": {
          "gas": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.72,
            "sourceIds": []
          },
          "liquid": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.12,
            "sourceIds": []
          }
        },
        "graftSlots": [],
        "provenance": "site"
      }
    },
    "connections": {
      "site_route_1:west_intake__switchyard": {
        "id": "site_route_1:west_intake__switchyard",
        "rooms": [
          "west_intake",
          "switchyard"
        ],
        "hostRoomId": "west_intake",
        "defaultOpen": true,
        "defaultSealed": false,
        "sealGroupId": "site_seal:site_route_1:west_intake__switchyard",
        "gasConductance": 0.22,
        "liquidConductance": 0.24,
        "aperture": 1,
        "kind": "passage",
        "connectorCells": [
          {
            "column": 11,
            "elevation": 4
          }
        ],
        "endpoints": [
          {
            "column": 10,
            "elevation": 4
          },
          {
            "column": 12,
            "elevation": 4
          }
        ],
        "orientation": "horizontal",
        "sillElevation": 4,
        "liquidMode": "spill"
      },
      "site_route_2:switchyard__furnace": {
        "id": "site_route_2:switchyard__furnace",
        "rooms": [
          "switchyard",
          "furnace"
        ],
        "hostRoomId": "switchyard",
        "defaultOpen": true,
        "defaultSealed": false,
        "sealGroupId": "site_seal:site_route_2:switchyard__furnace",
        "gasConductance": 0.22,
        "liquidConductance": 0.24,
        "aperture": 1,
        "kind": "passage",
        "connectorCells": [
          {
            "column": 28,
            "elevation": 4
          }
        ],
        "endpoints": [
          {
            "column": 27,
            "elevation": 4
          },
          {
            "column": 29,
            "elevation": 4
          }
        ],
        "orientation": "horizontal",
        "sillElevation": 4,
        "liquidMode": "spill"
      },
      "site_route_3:furnace__reservoir": {
        "id": "site_route_3:furnace__reservoir",
        "rooms": [
          "furnace",
          "reservoir"
        ],
        "hostRoomId": "furnace",
        "defaultOpen": true,
        "defaultSealed": false,
        "sealGroupId": "site_seal:site_route_3:furnace__reservoir",
        "gasConductance": 0.22,
        "liquidConductance": 0.24,
        "aperture": 1,
        "kind": "passage",
        "connectorCells": [
          {
            "column": 47,
            "elevation": 4
          }
        ],
        "endpoints": [
          {
            "column": 46,
            "elevation": 4
          },
          {
            "column": 48,
            "elevation": 4
          }
        ],
        "orientation": "horizontal",
        "sillElevation": 4,
        "liquidMode": "spill"
      },
      "site_route_4:reservoir__gallery": {
        "id": "site_route_4:reservoir__gallery",
        "rooms": [
          "reservoir",
          "gallery"
        ],
        "hostRoomId": "reservoir",
        "defaultOpen": true,
        "defaultSealed": false,
        "sealGroupId": "site_seal:site_route_4:reservoir__gallery",
        "gasConductance": 0.22,
        "liquidConductance": 0.24,
        "aperture": 1,
        "kind": "passage",
        "connectorCells": [
          {
            "column": 68,
            "elevation": 4
          }
        ],
        "endpoints": [
          {
            "column": 67,
            "elevation": 4
          },
          {
            "column": 69,
            "elevation": 4
          }
        ],
        "orientation": "horizontal",
        "sillElevation": 4,
        "liquidMode": "spill"
      },
      "site_route_5:gallery__lower_intake": {
        "id": "site_route_5:gallery__lower_intake",
        "rooms": [
          "gallery",
          "lower_intake"
        ],
        "hostRoomId": "gallery",
        "defaultOpen": true,
        "defaultSealed": false,
        "sealGroupId": "site_seal:site_route_5:gallery__lower_intake",
        "gasConductance": 0.22,
        "liquidConductance": 0.24,
        "aperture": 1,
        "kind": "passage",
        "connectorCells": [
          {
            "column": 83,
            "elevation": 4
          }
        ],
        "endpoints": [
          {
            "column": 82,
            "elevation": 4
          },
          {
            "column": 84,
            "elevation": 4
          }
        ],
        "orientation": "horizontal",
        "sillElevation": 4,
        "liquidMode": "spill"
      },
      "site_route_6:lower_intake__washlock": {
        "id": "site_route_6:lower_intake__washlock",
        "rooms": [
          "lower_intake",
          "washlock"
        ],
        "hostRoomId": "lower_intake",
        "defaultOpen": true,
        "defaultSealed": false,
        "sealGroupId": "site_seal:site_route_6:lower_intake__washlock",
        "gasConductance": 0.22,
        "liquidConductance": 0.24,
        "aperture": 1,
        "kind": "passage",
        "connectorCells": [
          {
            "column": 101,
            "elevation": 4
          }
        ],
        "endpoints": [
          {
            "column": 100,
            "elevation": 4
          },
          {
            "column": 102,
            "elevation": 4
          }
        ],
        "orientation": "horizontal",
        "sillElevation": 4,
        "liquidMode": "spill"
      },
      "washlock_to_core_door": {
        "id": "washlock_to_core_door",
        "kind": "core_door",
        "rooms": [
          "washlock",
          "core"
        ],
        "connectorCells": [
          {
            "column": 121,
            "elevation": 4
          },
          {
            "column": 122,
            "elevation": 4
          }
        ],
        "endpoints": [
          {
            "column": 120,
            "elevation": 4
          },
          {
            "column": 123,
            "elevation": 4
          }
        ],
        "orientation": "horizontal",
        "sillElevation": 4,
        "aperture": 2,
        "gasConductance": 0,
        "liquidConductance": 0,
        "liquidMode": "blocked",
        "hostRoomId": "washlock",
        "defaultOpen": false,
        "defaultSealed": true,
        "sealGroupId": null
      }
    },
    "utilityNodes": {
      "gas_reservoir": {
        "cell": {
          "column": 126,
          "elevation": 16
        },
        "hostRoomId": "core"
      },
      "hazard_gas_reservoir": {
        "cell": {
          "column": 105,
          "elevation": 6
        },
        "hostRoomId": "washlock"
      },
      "liquid_reservoir_a": {
        "cell": {
          "column": 126,
          "elevation": 6
        },
        "hostRoomId": "core"
      },
      "liquid_reservoir_b": {
        "cell": {
          "column": 130,
          "elevation": 6
        },
        "hostRoomId": "core"
      },
      "hazard_liquid_reservoir": {
        "cell": {
          "column": 114,
          "elevation": 6
        },
        "hostRoomId": "washlock"
      },
      "gas_vent": {
        "cell": {
          "column": 136,
          "elevation": 16
        },
        "hostRoomId": "core"
      },
      "liquid_drain": {
        "cell": {
          "column": 136,
          "elevation": 6
        },
        "hostRoomId": "core"
      }
    }
  },
  "cordon_41": {
    "width": 166,
    "height": 64,
    "cellSize": 16,
    "ringRadii": {
      "inner": 28,
      "middle": 54
    },
    "coreAnchor": {
      "column": 130,
      "elevation": 12
    },
    "coreBreachCell": {
      "column": 119,
      "elevation": 4
    },
    "entryCell": {
      "column": 52,
      "elevation": 6
    },
    "routeGraph": {
      "coreNodeId": "core",
      "nodes": {
        "ingress:entry_to_core": {
          "id": "ingress:entry_to_core",
          "kind": "ingress",
          "cell": {
            "column": 52,
            "elevation": 6
          }
        },
        "core": {
          "id": "core",
          "kind": "core",
          "cell": {
            "column": 119,
            "elevation": 4
          }
        }
      },
      "edges": {},
      "routes": {
        "entry_to_core": {
          "id": "entry_to_core",
          "ingressNodeId": "ingress:entry_to_core",
          "edgeIds": [],
          "authoredOrder": 0
        }
      }
    },
    "rooms": {
      "washlock": {
        "id": "washlock",
        "code": "R-06",
        "structure": "room",
        "ambientTemperature": 22,
        "socketCount": 2,
        "bounds": {
          "column": 100,
          "elevation": 4,
          "width": 19,
          "height": 9
        },
        "socketCells": {
          "socket_a": {
            "column": 105,
            "elevation": 4
          },
          "socket_b": {
            "column": 115,
            "elevation": 4
          }
        },
        "platformCells": [],
        "ladderCells": [
          {
            "column": 109,
            "elevation": 4
          },
          {
            "column": 109,
            "elevation": 5
          },
          {
            "column": 109,
            "elevation": 6
          },
          {
            "column": 109,
            "elevation": 7
          },
          {
            "column": 109,
            "elevation": 8
          },
          {
            "column": 109,
            "elevation": 9
          },
          {
            "column": 109,
            "elevation": 10
          },
          {
            "column": 109,
            "elevation": 11
          },
          {
            "column": 109,
            "elevation": 12
          }
        ],
        "taps": {
          "gas": {
            "capacity": 18,
            "includeRoomInventory": false,
            "roomPortHeight": 0.72,
            "sourceIds": [
              "hazard_gas_reservoir"
            ]
          },
          "liquid": {
            "capacity": 20,
            "includeRoomInventory": false,
            "roomPortHeight": 0.12,
            "sourceIds": [
              "hazard_liquid_reservoir"
            ]
          }
        },
        "graftSlots": [
          {
            "id": "forward",
            "cell": {
              "column": 100,
              "elevation": 4
            },
            "facing": "left"
          },
          {
            "id": "upper",
            "cell": {
              "column": 109,
              "elevation": 12
            },
            "facing": "up"
          }
        ],
        "provenance": "hull"
      },
      "core": {
        "id": "core",
        "code": "CORE",
        "structure": "core",
        "ambientTemperature": 26,
        "socketCount": 0,
        "bounds": {
          "column": 121,
          "elevation": 4,
          "width": 18,
          "height": 16
        },
        "socketCells": {},
        "platformCells": [],
        "ladderCells": [],
        "taps": {
          "gas": {
            "capacity": 24,
            "includeRoomInventory": false,
            "roomPortHeight": 0.72,
            "sourceIds": [
              "gas_reservoir"
            ]
          },
          "liquid": {
            "capacity": 28,
            "includeRoomInventory": false,
            "roomPortHeight": 0.12,
            "sourceIds": [
              "liquid_reservoir_a",
              "liquid_reservoir_b"
            ]
          }
        },
        "graftSlots": [],
        "provenance": "hull"
      },
      "gallery": {
        "id": "gallery",
        "code": "C41-4",
        "structure": "room",
        "ambientTemperature": 22,
        "socketCount": 2,
        "bounds": {
          "column": 88,
          "elevation": 4,
          "width": 11,
          "height": 15
        },
        "socketCells": {
          "socket_a": {
            "column": 91,
            "elevation": 4
          },
          "socket_b": {
            "column": 95,
            "elevation": 4
          }
        },
        "platformCells": [],
        "ladderCells": [
          {
            "column": 93,
            "elevation": 4
          },
          {
            "column": 93,
            "elevation": 5
          },
          {
            "column": 93,
            "elevation": 6
          },
          {
            "column": 93,
            "elevation": 7
          },
          {
            "column": 93,
            "elevation": 8
          },
          {
            "column": 93,
            "elevation": 9
          },
          {
            "column": 93,
            "elevation": 10
          },
          {
            "column": 93,
            "elevation": 11
          },
          {
            "column": 93,
            "elevation": 12
          },
          {
            "column": 93,
            "elevation": 13
          },
          {
            "column": 93,
            "elevation": 14
          },
          {
            "column": 93,
            "elevation": 15
          },
          {
            "column": 93,
            "elevation": 16
          },
          {
            "column": 93,
            "elevation": 17
          },
          {
            "column": 93,
            "elevation": 18
          }
        ],
        "taps": {
          "gas": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.72,
            "sourceIds": []
          },
          "liquid": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.12,
            "sourceIds": []
          }
        },
        "graftSlots": [],
        "provenance": "site"
      },
      "lower_intake": {
        "id": "lower_intake",
        "code": "C41-5",
        "structure": "room",
        "ambientTemperature": 22,
        "socketCount": 2,
        "bounds": {
          "column": 84,
          "elevation": 20,
          "width": 15,
          "height": 11
        },
        "socketCells": {
          "socket_a": {
            "column": 89,
            "elevation": 20
          },
          "socket_b": {
            "column": 94,
            "elevation": 20
          }
        },
        "platformCells": [],
        "ladderCells": [
          {
            "column": 93,
            "elevation": 20
          },
          {
            "column": 93,
            "elevation": 21
          },
          {
            "column": 93,
            "elevation": 22
          },
          {
            "column": 93,
            "elevation": 23
          },
          {
            "column": 93,
            "elevation": 24
          },
          {
            "column": 93,
            "elevation": 25
          },
          {
            "column": 93,
            "elevation": 26
          },
          {
            "column": 93,
            "elevation": 27
          },
          {
            "column": 93,
            "elevation": 28
          },
          {
            "column": 93,
            "elevation": 29
          },
          {
            "column": 93,
            "elevation": 30
          }
        ],
        "taps": {
          "gas": {
            "capacity": 26,
            "includeRoomInventory": true,
            "roomPortHeight": 0.72,
            "sourceIds": []
          },
          "liquid": {
            "capacity": 22,
            "includeRoomInventory": true,
            "roomPortHeight": 0.12,
            "sourceIds": []
          }
        },
        "graftSlots": [],
        "provenance": "site"
      },
      "furnace": {
        "id": "furnace",
        "code": "C41-2",
        "structure": "room",
        "ambientTemperature": 22,
        "socketCount": 2,
        "bounds": {
          "column": 69,
          "elevation": 20,
          "width": 14,
          "height": 15
        },
        "socketCells": {
          "socket_a": {
            "column": 73,
            "elevation": 20
          },
          "socket_b": {
            "column": 79,
            "elevation": 20
          }
        },
        "platformCells": [],
        "ladderCells": [
          {
            "column": 76,
            "elevation": 20
          },
          {
            "column": 76,
            "elevation": 21
          },
          {
            "column": 76,
            "elevation": 22
          },
          {
            "column": 76,
            "elevation": 23
          },
          {
            "column": 76,
            "elevation": 24
          },
          {
            "column": 76,
            "elevation": 25
          },
          {
            "column": 76,
            "elevation": 26
          },
          {
            "column": 76,
            "elevation": 27
          },
          {
            "column": 76,
            "elevation": 28
          },
          {
            "column": 76,
            "elevation": 29
          },
          {
            "column": 76,
            "elevation": 30
          },
          {
            "column": 76,
            "elevation": 31
          },
          {
            "column": 76,
            "elevation": 32
          },
          {
            "column": 76,
            "elevation": 33
          },
          {
            "column": 76,
            "elevation": 34
          }
        ],
        "taps": {
          "gas": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.72,
            "sourceIds": []
          },
          "liquid": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.12,
            "sourceIds": []
          }
        },
        "graftSlots": [],
        "provenance": "site"
      },
      "reservoir": {
        "id": "reservoir",
        "code": "C41-3",
        "structure": "room",
        "ambientTemperature": 22,
        "socketCount": 2,
        "bounds": {
          "column": 70,
          "elevation": 6,
          "width": 13,
          "height": 13
        },
        "socketCells": {
          "socket_a": {
            "column": 74,
            "elevation": 6
          },
          "socket_b": {
            "column": 79,
            "elevation": 6
          }
        },
        "platformCells": [],
        "ladderCells": [
          {
            "column": 76,
            "elevation": 6
          },
          {
            "column": 76,
            "elevation": 7
          },
          {
            "column": 76,
            "elevation": 8
          },
          {
            "column": 76,
            "elevation": 9
          },
          {
            "column": 76,
            "elevation": 10
          },
          {
            "column": 76,
            "elevation": 11
          },
          {
            "column": 76,
            "elevation": 12
          },
          {
            "column": 76,
            "elevation": 13
          },
          {
            "column": 76,
            "elevation": 14
          },
          {
            "column": 76,
            "elevation": 15
          },
          {
            "column": 76,
            "elevation": 16
          },
          {
            "column": 76,
            "elevation": 17
          },
          {
            "column": 76,
            "elevation": 18
          }
        ],
        "taps": {
          "gas": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.72,
            "sourceIds": []
          },
          "liquid": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.12,
            "sourceIds": []
          }
        },
        "graftSlots": [],
        "provenance": "site"
      },
      "switchyard": {
        "id": "switchyard",
        "code": "C41-1",
        "structure": "room",
        "ambientTemperature": 22,
        "socketCount": 2,
        "bounds": {
          "column": 57,
          "elevation": 6,
          "width": 12,
          "height": 12
        },
        "socketCells": {
          "socket_a": {
            "column": 61,
            "elevation": 6
          },
          "socket_b": {
            "column": 65,
            "elevation": 6
          }
        },
        "platformCells": [],
        "ladderCells": [],
        "taps": {
          "gas": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.72,
            "sourceIds": []
          },
          "liquid": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.12,
            "sourceIds": []
          }
        },
        "graftSlots": [],
        "provenance": "site"
      },
      "west_intake": {
        "id": "west_intake",
        "code": "C41-0",
        "structure": "entry",
        "ambientTemperature": 22,
        "socketCount": 0,
        "bounds": {
          "column": 52,
          "elevation": 6,
          "width": 4,
          "height": 8
        },
        "socketCells": {},
        "platformCells": [],
        "ladderCells": [],
        "taps": {
          "gas": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.72,
            "sourceIds": []
          },
          "liquid": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.12,
            "sourceIds": []
          }
        },
        "graftSlots": [],
        "provenance": "site"
      }
    },
    "connections": {
      "site_route_1:west_intake__switchyard": {
        "id": "site_route_1:west_intake__switchyard",
        "rooms": [
          "west_intake",
          "switchyard"
        ],
        "hostRoomId": "west_intake",
        "defaultOpen": true,
        "defaultSealed": false,
        "sealGroupId": "site_seal:site_route_1:west_intake__switchyard",
        "gasConductance": 0.22,
        "liquidConductance": 0.24,
        "aperture": 1,
        "kind": "passage",
        "connectorCells": [
          {
            "column": 56,
            "elevation": 6
          }
        ],
        "endpoints": [
          {
            "column": 55,
            "elevation": 6
          },
          {
            "column": 57,
            "elevation": 6
          }
        ],
        "orientation": "horizontal",
        "sillElevation": 6,
        "liquidMode": "spill"
      },
      "site_route_2:switchyard__reservoir": {
        "id": "site_route_2:switchyard__reservoir",
        "rooms": [
          "switchyard",
          "reservoir"
        ],
        "hostRoomId": "switchyard",
        "defaultOpen": true,
        "defaultSealed": false,
        "sealGroupId": "site_seal:site_route_2:switchyard__reservoir",
        "gasConductance": 0.22,
        "liquidConductance": 0.24,
        "aperture": 1,
        "kind": "passage",
        "connectorCells": [
          {
            "column": 69,
            "elevation": 6
          }
        ],
        "endpoints": [
          {
            "column": 68,
            "elevation": 6
          },
          {
            "column": 70,
            "elevation": 6
          }
        ],
        "orientation": "horizontal",
        "sillElevation": 6,
        "liquidMode": "spill"
      },
      "site_route_3:reservoir__furnace": {
        "id": "site_route_3:reservoir__furnace",
        "rooms": [
          "reservoir",
          "furnace"
        ],
        "hostRoomId": "reservoir",
        "defaultOpen": true,
        "defaultSealed": false,
        "sealGroupId": "site_seal:site_route_3:reservoir__furnace",
        "gasConductance": 0.22,
        "liquidConductance": 0.24,
        "aperture": 1,
        "kind": "ladder_shaft",
        "connectorCells": [
          {
            "column": 76,
            "elevation": 19
          }
        ],
        "endpoints": [
          {
            "column": 76,
            "elevation": 18
          },
          {
            "column": 76,
            "elevation": 20
          }
        ],
        "orientation": "vertical",
        "sillElevation": 19,
        "liquidMode": "drain"
      },
      "site_route_4:furnace__lower_intake": {
        "id": "site_route_4:furnace__lower_intake",
        "rooms": [
          "furnace",
          "lower_intake"
        ],
        "hostRoomId": "furnace",
        "defaultOpen": true,
        "defaultSealed": false,
        "sealGroupId": "site_seal:site_route_4:furnace__lower_intake",
        "gasConductance": 0.22,
        "liquidConductance": 0.24,
        "aperture": 1,
        "kind": "passage",
        "connectorCells": [
          {
            "column": 83,
            "elevation": 20
          }
        ],
        "endpoints": [
          {
            "column": 82,
            "elevation": 20
          },
          {
            "column": 84,
            "elevation": 20
          }
        ],
        "orientation": "horizontal",
        "sillElevation": 20,
        "liquidMode": "spill"
      },
      "site_route_5:lower_intake__gallery": {
        "id": "site_route_5:lower_intake__gallery",
        "rooms": [
          "lower_intake",
          "gallery"
        ],
        "hostRoomId": "gallery",
        "defaultOpen": true,
        "defaultSealed": false,
        "sealGroupId": "site_seal:site_route_5:lower_intake__gallery",
        "gasConductance": 0.22,
        "liquidConductance": 0.24,
        "aperture": 1,
        "kind": "ladder_shaft",
        "connectorCells": [
          {
            "column": 93,
            "elevation": 19
          }
        ],
        "endpoints": [
          {
            "column": 93,
            "elevation": 20
          },
          {
            "column": 93,
            "elevation": 18
          }
        ],
        "orientation": "vertical",
        "sillElevation": 19,
        "liquidMode": "drain"
      },
      "site_route_6:gallery__washlock": {
        "id": "site_route_6:gallery__washlock",
        "rooms": [
          "gallery",
          "washlock"
        ],
        "hostRoomId": "gallery",
        "defaultOpen": true,
        "defaultSealed": false,
        "sealGroupId": "site_seal:site_route_6:gallery__washlock",
        "gasConductance": 0.22,
        "liquidConductance": 0.24,
        "aperture": 1,
        "kind": "passage",
        "connectorCells": [
          {
            "column": 99,
            "elevation": 4
          }
        ],
        "endpoints": [
          {
            "column": 98,
            "elevation": 4
          },
          {
            "column": 100,
            "elevation": 4
          }
        ],
        "orientation": "horizontal",
        "sillElevation": 4,
        "liquidMode": "spill"
      },
      "washlock_to_core_door": {
        "id": "washlock_to_core_door",
        "kind": "core_door",
        "rooms": [
          "washlock",
          "core"
        ],
        "connectorCells": [
          {
            "column": 119,
            "elevation": 4
          },
          {
            "column": 120,
            "elevation": 4
          }
        ],
        "endpoints": [
          {
            "column": 118,
            "elevation": 4
          },
          {
            "column": 121,
            "elevation": 4
          }
        ],
        "orientation": "horizontal",
        "sillElevation": 4,
        "aperture": 2,
        "gasConductance": 0,
        "liquidConductance": 0,
        "liquidMode": "blocked",
        "hostRoomId": "washlock",
        "defaultOpen": false,
        "defaultSealed": true,
        "sealGroupId": null
      }
    },
    "utilityNodes": {
      "gas_reservoir": {
        "cell": {
          "column": 124,
          "elevation": 16
        },
        "hostRoomId": "core"
      },
      "hazard_gas_reservoir": {
        "cell": {
          "column": 103,
          "elevation": 6
        },
        "hostRoomId": "washlock"
      },
      "liquid_reservoir_a": {
        "cell": {
          "column": 124,
          "elevation": 6
        },
        "hostRoomId": "core"
      },
      "liquid_reservoir_b": {
        "cell": {
          "column": 128,
          "elevation": 6
        },
        "hostRoomId": "core"
      },
      "hazard_liquid_reservoir": {
        "cell": {
          "column": 112,
          "elevation": 6
        },
        "hostRoomId": "washlock"
      },
      "gas_vent": {
        "cell": {
          "column": 134,
          "elevation": 16
        },
        "hostRoomId": "core"
      },
      "liquid_drain": {
        "cell": {
          "column": 134,
          "elevation": 6
        },
        "hostRoomId": "core"
      }
    }
  },
  "junction_l6": {
    "width": 166,
    "height": 64,
    "cellSize": 16,
    "ringRadii": {
      "inner": 28,
      "middle": 54
    },
    "coreAnchor": {
      "column": 138,
      "elevation": 12
    },
    "coreBreachCell": {
      "column": 127,
      "elevation": 4
    },
    "entryCell": {
      "column": 39,
      "elevation": 4
    },
    "routeGraph": {
      "coreNodeId": "core",
      "nodes": {
        "ingress:entry_to_core": {
          "id": "ingress:entry_to_core",
          "kind": "ingress",
          "cell": {
            "column": 39,
            "elevation": 4
          }
        },
        "core": {
          "id": "core",
          "kind": "core",
          "cell": {
            "column": 127,
            "elevation": 4
          }
        }
      },
      "edges": {},
      "routes": {
        "entry_to_core": {
          "id": "entry_to_core",
          "ingressNodeId": "ingress:entry_to_core",
          "edgeIds": [],
          "authoredOrder": 0
        }
      }
    },
    "rooms": {
      "washlock": {
        "id": "washlock",
        "code": "R-06",
        "structure": "room",
        "ambientTemperature": 22,
        "socketCount": 2,
        "bounds": {
          "column": 108,
          "elevation": 4,
          "width": 19,
          "height": 9
        },
        "socketCells": {
          "socket_a": {
            "column": 113,
            "elevation": 4
          },
          "socket_b": {
            "column": 123,
            "elevation": 4
          }
        },
        "platformCells": [],
        "ladderCells": [
          {
            "column": 117,
            "elevation": 4
          },
          {
            "column": 117,
            "elevation": 5
          },
          {
            "column": 117,
            "elevation": 6
          },
          {
            "column": 117,
            "elevation": 7
          },
          {
            "column": 117,
            "elevation": 8
          },
          {
            "column": 117,
            "elevation": 9
          },
          {
            "column": 117,
            "elevation": 10
          },
          {
            "column": 117,
            "elevation": 11
          },
          {
            "column": 117,
            "elevation": 12
          }
        ],
        "taps": {
          "gas": {
            "capacity": 18,
            "includeRoomInventory": false,
            "roomPortHeight": 0.72,
            "sourceIds": [
              "hazard_gas_reservoir"
            ]
          },
          "liquid": {
            "capacity": 20,
            "includeRoomInventory": false,
            "roomPortHeight": 0.12,
            "sourceIds": [
              "hazard_liquid_reservoir"
            ]
          }
        },
        "graftSlots": [
          {
            "id": "forward",
            "cell": {
              "column": 108,
              "elevation": 4
            },
            "facing": "left"
          },
          {
            "id": "upper",
            "cell": {
              "column": 117,
              "elevation": 12
            },
            "facing": "up"
          }
        ],
        "provenance": "hull"
      },
      "core": {
        "id": "core",
        "code": "CORE",
        "structure": "core",
        "ambientTemperature": 26,
        "socketCount": 0,
        "bounds": {
          "column": 129,
          "elevation": 4,
          "width": 18,
          "height": 16
        },
        "socketCells": {},
        "platformCells": [],
        "ladderCells": [],
        "taps": {
          "gas": {
            "capacity": 24,
            "includeRoomInventory": false,
            "roomPortHeight": 0.72,
            "sourceIds": [
              "gas_reservoir"
            ]
          },
          "liquid": {
            "capacity": 28,
            "includeRoomInventory": false,
            "roomPortHeight": 0.12,
            "sourceIds": [
              "liquid_reservoir_a",
              "liquid_reservoir_b"
            ]
          }
        },
        "graftSlots": [],
        "provenance": "hull"
      },
      "gallery": {
        "id": "gallery",
        "code": "L6-04",
        "structure": "room",
        "ambientTemperature": 22,
        "socketCount": 2,
        "bounds": {
          "column": 89,
          "elevation": 4,
          "width": 18,
          "height": 9
        },
        "socketCells": {
          "socket_a": {
            "column": 95,
            "elevation": 4
          },
          "socket_b": {
            "column": 101,
            "elevation": 4
          }
        },
        "platformCells": [],
        "ladderCells": [
          {
            "column": 97,
            "elevation": 4
          },
          {
            "column": 97,
            "elevation": 5
          },
          {
            "column": 97,
            "elevation": 6
          },
          {
            "column": 97,
            "elevation": 7
          },
          {
            "column": 97,
            "elevation": 8
          },
          {
            "column": 97,
            "elevation": 9
          },
          {
            "column": 97,
            "elevation": 10
          },
          {
            "column": 97,
            "elevation": 11
          },
          {
            "column": 97,
            "elevation": 12
          }
        ],
        "taps": {
          "gas": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.72,
            "sourceIds": []
          },
          "liquid": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.12,
            "sourceIds": []
          }
        },
        "graftSlots": [],
        "provenance": "site"
      },
      "furnace": {
        "id": "furnace",
        "code": "L6-02",
        "structure": "room",
        "ambientTemperature": 22,
        "socketCount": 2,
        "bounds": {
          "column": 89,
          "elevation": 14,
          "width": 18,
          "height": 10
        },
        "socketCells": {
          "socket_a": {
            "column": 95,
            "elevation": 14
          },
          "socket_b": {
            "column": 101,
            "elevation": 14
          }
        },
        "platformCells": [],
        "ladderCells": [
          {
            "column": 97,
            "elevation": 14
          },
          {
            "column": 97,
            "elevation": 15
          },
          {
            "column": 97,
            "elevation": 16
          },
          {
            "column": 97,
            "elevation": 17
          },
          {
            "column": 97,
            "elevation": 18
          },
          {
            "column": 97,
            "elevation": 19
          },
          {
            "column": 97,
            "elevation": 20
          },
          {
            "column": 97,
            "elevation": 21
          },
          {
            "column": 97,
            "elevation": 22
          },
          {
            "column": 97,
            "elevation": 23
          }
        ],
        "taps": {
          "gas": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.72,
            "sourceIds": []
          },
          "liquid": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.12,
            "sourceIds": []
          }
        },
        "graftSlots": [],
        "provenance": "site"
      },
      "lower_intake": {
        "id": "lower_intake",
        "code": "L6-05",
        "structure": "room",
        "ambientTemperature": 22,
        "socketCount": 2,
        "bounds": {
          "column": 69,
          "elevation": 14,
          "width": 19,
          "height": 10
        },
        "socketCells": {
          "socket_a": {
            "column": 75,
            "elevation": 14
          },
          "socket_b": {
            "column": 82,
            "elevation": 14
          }
        },
        "platformCells": [],
        "ladderCells": [
          {
            "column": 78,
            "elevation": 14
          },
          {
            "column": 78,
            "elevation": 15
          },
          {
            "column": 78,
            "elevation": 16
          },
          {
            "column": 78,
            "elevation": 17
          },
          {
            "column": 78,
            "elevation": 18
          },
          {
            "column": 78,
            "elevation": 19
          },
          {
            "column": 78,
            "elevation": 20
          },
          {
            "column": 78,
            "elevation": 21
          },
          {
            "column": 78,
            "elevation": 22
          },
          {
            "column": 78,
            "elevation": 23
          }
        ],
        "taps": {
          "gas": {
            "capacity": 28,
            "includeRoomInventory": true,
            "roomPortHeight": 0.72,
            "sourceIds": []
          },
          "liquid": {
            "capacity": 24,
            "includeRoomInventory": true,
            "roomPortHeight": 0.12,
            "sourceIds": []
          }
        },
        "graftSlots": [],
        "provenance": "site"
      },
      "switchyard": {
        "id": "switchyard",
        "code": "L6-01",
        "structure": "room",
        "ambientTemperature": 22,
        "socketCount": 2,
        "bounds": {
          "column": 68,
          "elevation": 4,
          "width": 20,
          "height": 9
        },
        "socketCells": {
          "socket_a": {
            "column": 74,
            "elevation": 4
          },
          "socket_b": {
            "column": 82,
            "elevation": 4
          }
        },
        "platformCells": [],
        "ladderCells": [
          {
            "column": 78,
            "elevation": 4
          },
          {
            "column": 78,
            "elevation": 5
          },
          {
            "column": 78,
            "elevation": 6
          },
          {
            "column": 78,
            "elevation": 7
          },
          {
            "column": 78,
            "elevation": 8
          },
          {
            "column": 78,
            "elevation": 9
          },
          {
            "column": 78,
            "elevation": 10
          },
          {
            "column": 78,
            "elevation": 11
          },
          {
            "column": 78,
            "elevation": 12
          }
        ],
        "taps": {
          "gas": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.72,
            "sourceIds": []
          },
          "liquid": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.12,
            "sourceIds": []
          }
        },
        "graftSlots": [],
        "provenance": "site"
      },
      "reservoir": {
        "id": "reservoir",
        "code": "L6-03",
        "structure": "room",
        "ambientTemperature": 22,
        "socketCount": 2,
        "bounds": {
          "column": 45,
          "elevation": 4,
          "width": 22,
          "height": 10
        },
        "socketCells": {
          "socket_a": {
            "column": 52,
            "elevation": 4
          },
          "socket_b": {
            "column": 60,
            "elevation": 4
          }
        },
        "platformCells": [],
        "ladderCells": [],
        "taps": {
          "gas": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.72,
            "sourceIds": []
          },
          "liquid": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.12,
            "sourceIds": []
          }
        },
        "graftSlots": [],
        "provenance": "site"
      },
      "west_intake": {
        "id": "west_intake",
        "code": "L6-00",
        "structure": "entry",
        "ambientTemperature": 22,
        "socketCount": 0,
        "bounds": {
          "column": 39,
          "elevation": 4,
          "width": 5,
          "height": 9
        },
        "socketCells": {},
        "platformCells": [],
        "ladderCells": [],
        "taps": {
          "gas": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.72,
            "sourceIds": []
          },
          "liquid": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.12,
            "sourceIds": []
          }
        },
        "graftSlots": [],
        "provenance": "site"
      }
    },
    "connections": {
      "site_route_1:west_intake__reservoir": {
        "id": "site_route_1:west_intake__reservoir",
        "rooms": [
          "west_intake",
          "reservoir"
        ],
        "hostRoomId": "west_intake",
        "defaultOpen": true,
        "defaultSealed": false,
        "sealGroupId": "site_seal:site_route_1:west_intake__reservoir",
        "gasConductance": 0.22,
        "liquidConductance": 0.24,
        "aperture": 1,
        "kind": "passage",
        "connectorCells": [
          {
            "column": 44,
            "elevation": 4
          }
        ],
        "endpoints": [
          {
            "column": 43,
            "elevation": 4
          },
          {
            "column": 45,
            "elevation": 4
          }
        ],
        "orientation": "horizontal",
        "sillElevation": 4,
        "liquidMode": "spill"
      },
      "site_route_2:reservoir__switchyard": {
        "id": "site_route_2:reservoir__switchyard",
        "rooms": [
          "reservoir",
          "switchyard"
        ],
        "hostRoomId": "reservoir",
        "defaultOpen": true,
        "defaultSealed": false,
        "sealGroupId": "site_seal:site_route_2:reservoir__switchyard",
        "gasConductance": 0.22,
        "liquidConductance": 0.24,
        "aperture": 1,
        "kind": "passage",
        "connectorCells": [
          {
            "column": 67,
            "elevation": 4
          }
        ],
        "endpoints": [
          {
            "column": 66,
            "elevation": 4
          },
          {
            "column": 68,
            "elevation": 4
          }
        ],
        "orientation": "horizontal",
        "sillElevation": 4,
        "liquidMode": "spill"
      },
      "site_route_3:switchyard__lower_intake": {
        "id": "site_route_3:switchyard__lower_intake",
        "rooms": [
          "switchyard",
          "lower_intake"
        ],
        "hostRoomId": "switchyard",
        "defaultOpen": true,
        "defaultSealed": false,
        "sealGroupId": "site_seal:site_route_3:switchyard__lower_intake",
        "gasConductance": 0.22,
        "liquidConductance": 0.24,
        "aperture": 1,
        "kind": "ladder_shaft",
        "connectorCells": [
          {
            "column": 78,
            "elevation": 13
          }
        ],
        "endpoints": [
          {
            "column": 78,
            "elevation": 12
          },
          {
            "column": 78,
            "elevation": 14
          }
        ],
        "orientation": "vertical",
        "sillElevation": 13,
        "liquidMode": "drain"
      },
      "site_route_4:lower_intake__furnace": {
        "id": "site_route_4:lower_intake__furnace",
        "rooms": [
          "lower_intake",
          "furnace"
        ],
        "hostRoomId": "lower_intake",
        "defaultOpen": true,
        "defaultSealed": false,
        "sealGroupId": "site_seal:site_route_4:lower_intake__furnace",
        "gasConductance": 0.22,
        "liquidConductance": 0.24,
        "aperture": 1,
        "kind": "passage",
        "connectorCells": [
          {
            "column": 88,
            "elevation": 14
          }
        ],
        "endpoints": [
          {
            "column": 87,
            "elevation": 14
          },
          {
            "column": 89,
            "elevation": 14
          }
        ],
        "orientation": "horizontal",
        "sillElevation": 14,
        "liquidMode": "spill"
      },
      "site_route_5:furnace__gallery": {
        "id": "site_route_5:furnace__gallery",
        "rooms": [
          "furnace",
          "gallery"
        ],
        "hostRoomId": "gallery",
        "defaultOpen": true,
        "defaultSealed": false,
        "sealGroupId": "site_seal:site_route_5:furnace__gallery",
        "gasConductance": 0.22,
        "liquidConductance": 0.24,
        "aperture": 1,
        "kind": "ladder_shaft",
        "connectorCells": [
          {
            "column": 97,
            "elevation": 13
          }
        ],
        "endpoints": [
          {
            "column": 97,
            "elevation": 14
          },
          {
            "column": 97,
            "elevation": 12
          }
        ],
        "orientation": "vertical",
        "sillElevation": 13,
        "liquidMode": "drain"
      },
      "site_route_6:gallery__washlock": {
        "id": "site_route_6:gallery__washlock",
        "rooms": [
          "gallery",
          "washlock"
        ],
        "hostRoomId": "gallery",
        "defaultOpen": true,
        "defaultSealed": false,
        "sealGroupId": "site_seal:site_route_6:gallery__washlock",
        "gasConductance": 0.22,
        "liquidConductance": 0.24,
        "aperture": 1,
        "kind": "passage",
        "connectorCells": [
          {
            "column": 107,
            "elevation": 4
          }
        ],
        "endpoints": [
          {
            "column": 106,
            "elevation": 4
          },
          {
            "column": 108,
            "elevation": 4
          }
        ],
        "orientation": "horizontal",
        "sillElevation": 4,
        "liquidMode": "spill"
      },
      "washlock_to_core_door": {
        "id": "washlock_to_core_door",
        "kind": "core_door",
        "rooms": [
          "washlock",
          "core"
        ],
        "connectorCells": [
          {
            "column": 127,
            "elevation": 4
          },
          {
            "column": 128,
            "elevation": 4
          }
        ],
        "endpoints": [
          {
            "column": 126,
            "elevation": 4
          },
          {
            "column": 129,
            "elevation": 4
          }
        ],
        "orientation": "horizontal",
        "sillElevation": 4,
        "aperture": 2,
        "gasConductance": 0,
        "liquidConductance": 0,
        "liquidMode": "blocked",
        "hostRoomId": "washlock",
        "defaultOpen": false,
        "defaultSealed": true,
        "sealGroupId": null
      }
    },
    "utilityNodes": {
      "gas_reservoir": {
        "cell": {
          "column": 132,
          "elevation": 16
        },
        "hostRoomId": "core"
      },
      "hazard_gas_reservoir": {
        "cell": {
          "column": 111,
          "elevation": 6
        },
        "hostRoomId": "washlock"
      },
      "liquid_reservoir_a": {
        "cell": {
          "column": 132,
          "elevation": 6
        },
        "hostRoomId": "core"
      },
      "liquid_reservoir_b": {
        "cell": {
          "column": 136,
          "elevation": 6
        },
        "hostRoomId": "core"
      },
      "hazard_liquid_reservoir": {
        "cell": {
          "column": 120,
          "elevation": 6
        },
        "hostRoomId": "washlock"
      },
      "gas_vent": {
        "cell": {
          "column": 142,
          "elevation": 16
        },
        "hostRoomId": "core"
      },
      "liquid_drain": {
        "cell": {
          "column": 142,
          "elevation": 6
        },
        "hostRoomId": "core"
      }
    }
  },
  "pell_cut": {
    "width": 166,
    "height": 64,
    "cellSize": 16,
    "ringRadii": {
      "inner": 28,
      "middle": 54
    },
    "coreAnchor": {
      "column": 134,
      "elevation": 12
    },
    "coreBreachCell": {
      "column": 123,
      "elevation": 4
    },
    "entryCell": {
      "column": 45,
      "elevation": 4
    },
    "routeGraph": {
      "coreNodeId": "core",
      "nodes": {
        "ingress:entry_to_core": {
          "id": "ingress:entry_to_core",
          "kind": "ingress",
          "cell": {
            "column": 45,
            "elevation": 4
          }
        },
        "core": {
          "id": "core",
          "kind": "core",
          "cell": {
            "column": 123,
            "elevation": 4
          }
        }
      },
      "edges": {},
      "routes": {
        "entry_to_core": {
          "id": "entry_to_core",
          "ingressNodeId": "ingress:entry_to_core",
          "edgeIds": [],
          "authoredOrder": 0
        }
      }
    },
    "rooms": {
      "washlock": {
        "id": "washlock",
        "code": "R-06",
        "structure": "room",
        "ambientTemperature": 22,
        "socketCount": 2,
        "bounds": {
          "column": 104,
          "elevation": 4,
          "width": 19,
          "height": 9
        },
        "socketCells": {
          "socket_a": {
            "column": 109,
            "elevation": 4
          },
          "socket_b": {
            "column": 119,
            "elevation": 4
          }
        },
        "platformCells": [],
        "ladderCells": [
          {
            "column": 113,
            "elevation": 4
          },
          {
            "column": 113,
            "elevation": 5
          },
          {
            "column": 113,
            "elevation": 6
          },
          {
            "column": 113,
            "elevation": 7
          },
          {
            "column": 113,
            "elevation": 8
          },
          {
            "column": 113,
            "elevation": 9
          },
          {
            "column": 113,
            "elevation": 10
          },
          {
            "column": 113,
            "elevation": 11
          },
          {
            "column": 113,
            "elevation": 12
          }
        ],
        "taps": {
          "gas": {
            "capacity": 18,
            "includeRoomInventory": false,
            "roomPortHeight": 0.72,
            "sourceIds": [
              "hazard_gas_reservoir"
            ]
          },
          "liquid": {
            "capacity": 20,
            "includeRoomInventory": false,
            "roomPortHeight": 0.12,
            "sourceIds": [
              "hazard_liquid_reservoir"
            ]
          }
        },
        "graftSlots": [
          {
            "id": "forward",
            "cell": {
              "column": 104,
              "elevation": 4
            },
            "facing": "left"
          },
          {
            "id": "upper",
            "cell": {
              "column": 113,
              "elevation": 12
            },
            "facing": "up"
          }
        ],
        "provenance": "hull"
      },
      "core": {
        "id": "core",
        "code": "CORE",
        "structure": "core",
        "ambientTemperature": 26,
        "socketCount": 0,
        "bounds": {
          "column": 125,
          "elevation": 4,
          "width": 18,
          "height": 16
        },
        "socketCells": {},
        "platformCells": [],
        "ladderCells": [],
        "taps": {
          "gas": {
            "capacity": 24,
            "includeRoomInventory": false,
            "roomPortHeight": 0.72,
            "sourceIds": [
              "gas_reservoir"
            ]
          },
          "liquid": {
            "capacity": 28,
            "includeRoomInventory": false,
            "roomPortHeight": 0.12,
            "sourceIds": [
              "liquid_reservoir_a",
              "liquid_reservoir_b"
            ]
          }
        },
        "graftSlots": [],
        "provenance": "hull"
      },
      "lower_intake": {
        "id": "lower_intake",
        "code": "PC-05",
        "structure": "room",
        "ambientTemperature": 22,
        "socketCount": 2,
        "bounds": {
          "column": 86,
          "elevation": 4,
          "width": 17,
          "height": 12
        },
        "socketCells": {
          "socket_a": {
            "column": 91,
            "elevation": 4
          },
          "socket_b": {
            "column": 98,
            "elevation": 4
          }
        },
        "platformCells": [],
        "ladderCells": [
          {
            "column": 94,
            "elevation": 4
          },
          {
            "column": 94,
            "elevation": 5
          },
          {
            "column": 94,
            "elevation": 6
          },
          {
            "column": 94,
            "elevation": 7
          },
          {
            "column": 94,
            "elevation": 8
          },
          {
            "column": 94,
            "elevation": 9
          },
          {
            "column": 94,
            "elevation": 10
          },
          {
            "column": 94,
            "elevation": 11
          },
          {
            "column": 94,
            "elevation": 12
          },
          {
            "column": 94,
            "elevation": 13
          },
          {
            "column": 94,
            "elevation": 14
          },
          {
            "column": 94,
            "elevation": 15
          }
        ],
        "taps": {
          "gas": {
            "capacity": 30,
            "includeRoomInventory": true,
            "roomPortHeight": 0.72,
            "sourceIds": []
          },
          "liquid": {
            "capacity": 26,
            "includeRoomInventory": true,
            "roomPortHeight": 0.12,
            "sourceIds": []
          }
        },
        "graftSlots": [],
        "provenance": "site"
      },
      "gallery": {
        "id": "gallery",
        "code": "PC-04",
        "structure": "room",
        "ambientTemperature": 22,
        "socketCount": 2,
        "bounds": {
          "column": 86,
          "elevation": 17,
          "width": 17,
          "height": 12
        },
        "socketCells": {
          "socket_a": {
            "column": 91,
            "elevation": 17
          },
          "socket_b": {
            "column": 98,
            "elevation": 17
          }
        },
        "platformCells": [],
        "ladderCells": [
          {
            "column": 94,
            "elevation": 17
          },
          {
            "column": 94,
            "elevation": 18
          },
          {
            "column": 94,
            "elevation": 19
          },
          {
            "column": 94,
            "elevation": 20
          },
          {
            "column": 94,
            "elevation": 21
          },
          {
            "column": 94,
            "elevation": 22
          },
          {
            "column": 94,
            "elevation": 23
          },
          {
            "column": 94,
            "elevation": 24
          },
          {
            "column": 94,
            "elevation": 25
          },
          {
            "column": 94,
            "elevation": 26
          },
          {
            "column": 94,
            "elevation": 27
          },
          {
            "column": 94,
            "elevation": 28
          }
        ],
        "taps": {
          "gas": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.72,
            "sourceIds": []
          },
          "liquid": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.12,
            "sourceIds": []
          }
        },
        "graftSlots": [],
        "provenance": "site"
      },
      "reservoir": {
        "id": "reservoir",
        "code": "PC-03",
        "structure": "room",
        "ambientTemperature": 22,
        "socketCount": 2,
        "bounds": {
          "column": 68,
          "elevation": 17,
          "width": 17,
          "height": 12
        },
        "socketCells": {
          "socket_a": {
            "column": 73,
            "elevation": 17
          },
          "socket_b": {
            "column": 80,
            "elevation": 17
          }
        },
        "platformCells": [],
        "ladderCells": [
          {
            "column": 76,
            "elevation": 17
          },
          {
            "column": 76,
            "elevation": 18
          },
          {
            "column": 76,
            "elevation": 19
          },
          {
            "column": 76,
            "elevation": 20
          },
          {
            "column": 76,
            "elevation": 21
          },
          {
            "column": 76,
            "elevation": 22
          },
          {
            "column": 76,
            "elevation": 23
          },
          {
            "column": 76,
            "elevation": 24
          },
          {
            "column": 76,
            "elevation": 25
          },
          {
            "column": 76,
            "elevation": 26
          },
          {
            "column": 76,
            "elevation": 27
          },
          {
            "column": 76,
            "elevation": 28
          }
        ],
        "taps": {
          "gas": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.72,
            "sourceIds": [
              "specialty_gas_reservoir"
            ]
          },
          "liquid": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.12,
            "sourceIds": []
          }
        },
        "graftSlots": [],
        "provenance": "site"
      },
      "furnace": {
        "id": "furnace",
        "code": "PC-02",
        "structure": "room",
        "ambientTemperature": 22,
        "socketCount": 2,
        "bounds": {
          "column": 68,
          "elevation": 4,
          "width": 17,
          "height": 12
        },
        "socketCells": {
          "socket_a": {
            "column": 73,
            "elevation": 4
          },
          "socket_b": {
            "column": 80,
            "elevation": 4
          }
        },
        "platformCells": [],
        "ladderCells": [
          {
            "column": 76,
            "elevation": 4
          },
          {
            "column": 76,
            "elevation": 5
          },
          {
            "column": 76,
            "elevation": 6
          },
          {
            "column": 76,
            "elevation": 7
          },
          {
            "column": 76,
            "elevation": 8
          },
          {
            "column": 76,
            "elevation": 9
          },
          {
            "column": 76,
            "elevation": 10
          },
          {
            "column": 76,
            "elevation": 11
          },
          {
            "column": 76,
            "elevation": 12
          },
          {
            "column": 76,
            "elevation": 13
          },
          {
            "column": 76,
            "elevation": 14
          },
          {
            "column": 76,
            "elevation": 15
          }
        ],
        "taps": {
          "gas": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.72,
            "sourceIds": []
          },
          "liquid": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.12,
            "sourceIds": []
          }
        },
        "graftSlots": [],
        "provenance": "site"
      },
      "switchyard": {
        "id": "switchyard",
        "code": "PC-01",
        "structure": "room",
        "ambientTemperature": 22,
        "socketCount": 2,
        "bounds": {
          "column": 50,
          "elevation": 4,
          "width": 17,
          "height": 12
        },
        "socketCells": {
          "socket_a": {
            "column": 55,
            "elevation": 4
          },
          "socket_b": {
            "column": 62,
            "elevation": 4
          }
        },
        "platformCells": [],
        "ladderCells": [],
        "taps": {
          "gas": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.72,
            "sourceIds": []
          },
          "liquid": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.12,
            "sourceIds": []
          }
        },
        "graftSlots": [],
        "provenance": "site"
      },
      "west_intake": {
        "id": "west_intake",
        "code": "PC-00",
        "structure": "entry",
        "ambientTemperature": 22,
        "socketCount": 0,
        "bounds": {
          "column": 45,
          "elevation": 4,
          "width": 4,
          "height": 9
        },
        "socketCells": {},
        "platformCells": [],
        "ladderCells": [],
        "taps": {
          "gas": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.72,
            "sourceIds": []
          },
          "liquid": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.12,
            "sourceIds": []
          }
        },
        "graftSlots": [],
        "provenance": "site"
      }
    },
    "connections": {
      "site_route_1:west_intake__switchyard": {
        "id": "site_route_1:west_intake__switchyard",
        "rooms": [
          "west_intake",
          "switchyard"
        ],
        "hostRoomId": "west_intake",
        "defaultOpen": true,
        "defaultSealed": false,
        "sealGroupId": "site_seal:site_route_1:west_intake__switchyard",
        "gasConductance": 0.22,
        "liquidConductance": 0.24,
        "aperture": 1,
        "kind": "passage",
        "connectorCells": [
          {
            "column": 49,
            "elevation": 4
          }
        ],
        "endpoints": [
          {
            "column": 48,
            "elevation": 4
          },
          {
            "column": 50,
            "elevation": 4
          }
        ],
        "orientation": "horizontal",
        "sillElevation": 4,
        "liquidMode": "spill"
      },
      "site_route_2:switchyard__furnace": {
        "id": "site_route_2:switchyard__furnace",
        "rooms": [
          "switchyard",
          "furnace"
        ],
        "hostRoomId": "switchyard",
        "defaultOpen": true,
        "defaultSealed": false,
        "sealGroupId": "site_seal:site_route_2:switchyard__furnace",
        "gasConductance": 0.22,
        "liquidConductance": 0.24,
        "aperture": 1,
        "kind": "passage",
        "connectorCells": [
          {
            "column": 67,
            "elevation": 4
          }
        ],
        "endpoints": [
          {
            "column": 66,
            "elevation": 4
          },
          {
            "column": 68,
            "elevation": 4
          }
        ],
        "orientation": "horizontal",
        "sillElevation": 4,
        "liquidMode": "spill"
      },
      "site_route_3:furnace__reservoir": {
        "id": "site_route_3:furnace__reservoir",
        "rooms": [
          "furnace",
          "reservoir"
        ],
        "hostRoomId": "furnace",
        "defaultOpen": true,
        "defaultSealed": false,
        "sealGroupId": "site_seal:site_route_3:furnace__reservoir",
        "gasConductance": 0.22,
        "liquidConductance": 0.24,
        "aperture": 1,
        "kind": "ladder_shaft",
        "connectorCells": [
          {
            "column": 76,
            "elevation": 16
          }
        ],
        "endpoints": [
          {
            "column": 76,
            "elevation": 15
          },
          {
            "column": 76,
            "elevation": 17
          }
        ],
        "orientation": "vertical",
        "sillElevation": 16,
        "liquidMode": "drain"
      },
      "site_route_4:reservoir__gallery": {
        "id": "site_route_4:reservoir__gallery",
        "rooms": [
          "reservoir",
          "gallery"
        ],
        "hostRoomId": "reservoir",
        "defaultOpen": true,
        "defaultSealed": false,
        "sealGroupId": "site_seal:site_route_4:reservoir__gallery",
        "gasConductance": 0.22,
        "liquidConductance": 0.24,
        "aperture": 1,
        "kind": "passage",
        "connectorCells": [
          {
            "column": 85,
            "elevation": 17
          }
        ],
        "endpoints": [
          {
            "column": 84,
            "elevation": 17
          },
          {
            "column": 86,
            "elevation": 17
          }
        ],
        "orientation": "horizontal",
        "sillElevation": 17,
        "liquidMode": "spill"
      },
      "site_route_5:gallery__lower_intake": {
        "id": "site_route_5:gallery__lower_intake",
        "rooms": [
          "gallery",
          "lower_intake"
        ],
        "hostRoomId": "lower_intake",
        "defaultOpen": true,
        "defaultSealed": false,
        "sealGroupId": "site_seal:site_route_5:gallery__lower_intake",
        "gasConductance": 0.22,
        "liquidConductance": 0.24,
        "aperture": 1,
        "kind": "ladder_shaft",
        "connectorCells": [
          {
            "column": 94,
            "elevation": 16
          }
        ],
        "endpoints": [
          {
            "column": 94,
            "elevation": 17
          },
          {
            "column": 94,
            "elevation": 15
          }
        ],
        "orientation": "vertical",
        "sillElevation": 16,
        "liquidMode": "drain"
      },
      "site_route_6:lower_intake__washlock": {
        "id": "site_route_6:lower_intake__washlock",
        "rooms": [
          "lower_intake",
          "washlock"
        ],
        "hostRoomId": "lower_intake",
        "defaultOpen": true,
        "defaultSealed": false,
        "sealGroupId": "site_seal:site_route_6:lower_intake__washlock",
        "gasConductance": 0.22,
        "liquidConductance": 0.24,
        "aperture": 1,
        "kind": "passage",
        "connectorCells": [
          {
            "column": 103,
            "elevation": 4
          }
        ],
        "endpoints": [
          {
            "column": 102,
            "elevation": 4
          },
          {
            "column": 104,
            "elevation": 4
          }
        ],
        "orientation": "horizontal",
        "sillElevation": 4,
        "liquidMode": "spill"
      },
      "washlock_to_core_door": {
        "id": "washlock_to_core_door",
        "kind": "core_door",
        "rooms": [
          "washlock",
          "core"
        ],
        "connectorCells": [
          {
            "column": 123,
            "elevation": 4
          },
          {
            "column": 124,
            "elevation": 4
          }
        ],
        "endpoints": [
          {
            "column": 122,
            "elevation": 4
          },
          {
            "column": 125,
            "elevation": 4
          }
        ],
        "orientation": "horizontal",
        "sillElevation": 4,
        "aperture": 2,
        "gasConductance": 0,
        "liquidConductance": 0,
        "liquidMode": "blocked",
        "hostRoomId": "washlock",
        "defaultOpen": false,
        "defaultSealed": true,
        "sealGroupId": null
      }
    },
    "utilityNodes": {
      "gas_reservoir": {
        "cell": {
          "column": 128,
          "elevation": 16
        },
        "hostRoomId": "core"
      },
      "hazard_gas_reservoir": {
        "cell": {
          "column": 107,
          "elevation": 6
        },
        "hostRoomId": "washlock"
      },
      "liquid_reservoir_a": {
        "cell": {
          "column": 128,
          "elevation": 6
        },
        "hostRoomId": "core"
      },
      "liquid_reservoir_b": {
        "cell": {
          "column": 132,
          "elevation": 6
        },
        "hostRoomId": "core"
      },
      "hazard_liquid_reservoir": {
        "cell": {
          "column": 116,
          "elevation": 6
        },
        "hostRoomId": "washlock"
      },
      "gas_vent": {
        "cell": {
          "column": 138,
          "elevation": 16
        },
        "hostRoomId": "core"
      },
      "liquid_drain": {
        "cell": {
          "column": 138,
          "elevation": 6
        },
        "hostRoomId": "core"
      },
      "specialty_gas_reservoir": {
        "cell": {
          "column": 70,
          "elevation": 19
        },
        "hostRoomId": "reservoir"
      }
    }
  },
  "station_14": {
    "width": 176,
    "height": 68,
    "cellSize": 16,
    "ringRadii": {
      "inner": 30,
      "middle": 58
    },
    "coreAnchor": {
      "column": 136,
      "elevation": 12
    },
    "coreBreachCell": {
      "column": 125,
      "elevation": 4
    },
    "entryCell": {
      "column": 55,
      "elevation": 0
    },
    "routeGraph": {
      "coreNodeId": "core",
      "nodes": {
        "ingress:entry_to_core": {
          "id": "ingress:entry_to_core",
          "kind": "ingress",
          "cell": {
            "column": 55,
            "elevation": 0
          }
        },
        "core": {
          "id": "core",
          "kind": "core",
          "cell": {
            "column": 125,
            "elevation": 4
          }
        }
      },
      "edges": {},
      "routes": {
        "entry_to_core": {
          "id": "entry_to_core",
          "ingressNodeId": "ingress:entry_to_core",
          "edgeIds": [],
          "authoredOrder": 0
        }
      }
    },
    "rooms": {
      "washlock": {
        "id": "washlock",
        "code": "R-06",
        "structure": "room",
        "ambientTemperature": 22,
        "socketCount": 2,
        "bounds": {
          "column": 106,
          "elevation": 4,
          "width": 19,
          "height": 9
        },
        "socketCells": {
          "socket_a": {
            "column": 111,
            "elevation": 4
          },
          "socket_b": {
            "column": 121,
            "elevation": 4
          }
        },
        "platformCells": [],
        "ladderCells": [
          {
            "column": 115,
            "elevation": 4
          },
          {
            "column": 115,
            "elevation": 5
          },
          {
            "column": 115,
            "elevation": 6
          },
          {
            "column": 115,
            "elevation": 7
          },
          {
            "column": 115,
            "elevation": 8
          },
          {
            "column": 115,
            "elevation": 9
          },
          {
            "column": 115,
            "elevation": 10
          },
          {
            "column": 115,
            "elevation": 11
          },
          {
            "column": 115,
            "elevation": 12
          }
        ],
        "taps": {
          "gas": {
            "capacity": 18,
            "includeRoomInventory": false,
            "roomPortHeight": 0.72,
            "sourceIds": [
              "hazard_gas_reservoir"
            ]
          },
          "liquid": {
            "capacity": 20,
            "includeRoomInventory": false,
            "roomPortHeight": 0.12,
            "sourceIds": [
              "hazard_liquid_reservoir"
            ]
          }
        },
        "graftSlots": [
          {
            "id": "forward",
            "cell": {
              "column": 106,
              "elevation": 4
            },
            "facing": "left"
          },
          {
            "id": "upper",
            "cell": {
              "column": 115,
              "elevation": 12
            },
            "facing": "up"
          }
        ],
        "provenance": "hull"
      },
      "core": {
        "id": "core",
        "code": "CORE",
        "structure": "core",
        "ambientTemperature": 26,
        "socketCount": 0,
        "bounds": {
          "column": 127,
          "elevation": 4,
          "width": 18,
          "height": 16
        },
        "socketCells": {},
        "platformCells": [],
        "ladderCells": [],
        "taps": {
          "gas": {
            "capacity": 24,
            "includeRoomInventory": false,
            "roomPortHeight": 0.72,
            "sourceIds": [
              "gas_reservoir"
            ]
          },
          "liquid": {
            "capacity": 28,
            "includeRoomInventory": false,
            "roomPortHeight": 0.12,
            "sourceIds": [
              "liquid_reservoir_a",
              "liquid_reservoir_b"
            ]
          }
        },
        "graftSlots": [],
        "provenance": "hull"
      },
      "lower_intake": {
        "id": "lower_intake",
        "code": "S14-5",
        "structure": "room",
        "ambientTemperature": 22,
        "socketCount": 2,
        "bounds": {
          "column": 89,
          "elevation": 4,
          "width": 16,
          "height": 11
        },
        "socketCells": {
          "socket_a": {
            "column": 94,
            "elevation": 4
          },
          "socket_b": {
            "column": 100,
            "elevation": 4
          }
        },
        "platformCells": [],
        "ladderCells": [
          {
            "column": 96,
            "elevation": 4
          },
          {
            "column": 96,
            "elevation": 5
          },
          {
            "column": 96,
            "elevation": 6
          },
          {
            "column": 96,
            "elevation": 7
          },
          {
            "column": 96,
            "elevation": 8
          },
          {
            "column": 96,
            "elevation": 9
          },
          {
            "column": 96,
            "elevation": 10
          },
          {
            "column": 96,
            "elevation": 11
          },
          {
            "column": 96,
            "elevation": 12
          },
          {
            "column": 96,
            "elevation": 13
          },
          {
            "column": 96,
            "elevation": 14
          }
        ],
        "taps": {
          "gas": {
            "capacity": 32,
            "includeRoomInventory": true,
            "roomPortHeight": 0.72,
            "sourceIds": []
          },
          "liquid": {
            "capacity": 26,
            "includeRoomInventory": true,
            "roomPortHeight": 0.12,
            "sourceIds": []
          }
        },
        "graftSlots": [],
        "provenance": "site"
      },
      "furnace": {
        "id": "furnace",
        "code": "S14-2",
        "structure": "room",
        "ambientTemperature": 22,
        "socketCount": 2,
        "bounds": {
          "column": 89,
          "elevation": 16,
          "width": 16,
          "height": 12
        },
        "socketCells": {
          "socket_a": {
            "column": 94,
            "elevation": 16
          },
          "socket_b": {
            "column": 100,
            "elevation": 16
          }
        },
        "platformCells": [],
        "ladderCells": [
          {
            "column": 96,
            "elevation": 16
          },
          {
            "column": 96,
            "elevation": 17
          },
          {
            "column": 96,
            "elevation": 18
          },
          {
            "column": 96,
            "elevation": 19
          },
          {
            "column": 96,
            "elevation": 20
          },
          {
            "column": 96,
            "elevation": 21
          },
          {
            "column": 96,
            "elevation": 22
          },
          {
            "column": 96,
            "elevation": 23
          },
          {
            "column": 96,
            "elevation": 24
          },
          {
            "column": 96,
            "elevation": 25
          },
          {
            "column": 96,
            "elevation": 26
          },
          {
            "column": 96,
            "elevation": 27
          }
        ],
        "taps": {
          "gas": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.72,
            "sourceIds": []
          },
          "liquid": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.12,
            "sourceIds": []
          }
        },
        "graftSlots": [],
        "provenance": "site"
      },
      "reservoir": {
        "id": "reservoir",
        "code": "S14-3",
        "structure": "room",
        "ambientTemperature": 22,
        "socketCount": 2,
        "bounds": {
          "column": 73,
          "elevation": 16,
          "width": 15,
          "height": 14
        },
        "socketCells": {
          "socket_a": {
            "column": 78,
            "elevation": 16
          },
          "socket_b": {
            "column": 83,
            "elevation": 16
          }
        },
        "platformCells": [],
        "ladderCells": [
          {
            "column": 80,
            "elevation": 16
          },
          {
            "column": 80,
            "elevation": 17
          },
          {
            "column": 80,
            "elevation": 18
          },
          {
            "column": 80,
            "elevation": 19
          },
          {
            "column": 80,
            "elevation": 20
          },
          {
            "column": 80,
            "elevation": 21
          },
          {
            "column": 80,
            "elevation": 22
          },
          {
            "column": 80,
            "elevation": 23
          },
          {
            "column": 80,
            "elevation": 24
          },
          {
            "column": 80,
            "elevation": 25
          },
          {
            "column": 80,
            "elevation": 26
          },
          {
            "column": 80,
            "elevation": 27
          },
          {
            "column": 80,
            "elevation": 28
          },
          {
            "column": 80,
            "elevation": 29
          }
        ],
        "taps": {
          "gas": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.72,
            "sourceIds": [
              "specialty_gas_reservoir"
            ]
          },
          "liquid": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.12,
            "sourceIds": []
          }
        },
        "graftSlots": [],
        "provenance": "site"
      },
      "switchyard": {
        "id": "switchyard",
        "code": "S14-1",
        "structure": "room",
        "ambientTemperature": 22,
        "socketCount": 2,
        "bounds": {
          "column": 74,
          "elevation": 0,
          "width": 14,
          "height": 15
        },
        "socketCells": {
          "socket_a": {
            "column": 78,
            "elevation": 0
          },
          "socket_b": {
            "column": 84,
            "elevation": 0
          }
        },
        "platformCells": [],
        "ladderCells": [
          {
            "column": 80,
            "elevation": 0
          },
          {
            "column": 80,
            "elevation": 1
          },
          {
            "column": 80,
            "elevation": 2
          },
          {
            "column": 80,
            "elevation": 3
          },
          {
            "column": 80,
            "elevation": 4
          },
          {
            "column": 80,
            "elevation": 5
          },
          {
            "column": 80,
            "elevation": 6
          },
          {
            "column": 80,
            "elevation": 7
          },
          {
            "column": 80,
            "elevation": 8
          },
          {
            "column": 80,
            "elevation": 9
          },
          {
            "column": 80,
            "elevation": 10
          },
          {
            "column": 80,
            "elevation": 11
          },
          {
            "column": 80,
            "elevation": 12
          },
          {
            "column": 80,
            "elevation": 13
          },
          {
            "column": 80,
            "elevation": 14
          }
        ],
        "taps": {
          "gas": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.72,
            "sourceIds": []
          },
          "liquid": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.12,
            "sourceIds": []
          }
        },
        "graftSlots": [],
        "provenance": "site"
      },
      "gallery": {
        "id": "gallery",
        "code": "S14-4",
        "structure": "room",
        "ambientTemperature": 22,
        "socketCount": 2,
        "bounds": {
          "column": 60,
          "elevation": 0,
          "width": 13,
          "height": 16
        },
        "socketCells": {
          "socket_a": {
            "column": 64,
            "elevation": 0
          },
          "socket_b": {
            "column": 69,
            "elevation": 0
          }
        },
        "platformCells": [],
        "ladderCells": [],
        "taps": {
          "gas": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.72,
            "sourceIds": []
          },
          "liquid": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.12,
            "sourceIds": []
          }
        },
        "graftSlots": [],
        "provenance": "site"
      },
      "west_intake": {
        "id": "west_intake",
        "code": "S14-0",
        "structure": "entry",
        "ambientTemperature": 22,
        "socketCount": 0,
        "bounds": {
          "column": 55,
          "elevation": 0,
          "width": 4,
          "height": 9
        },
        "socketCells": {},
        "platformCells": [],
        "ladderCells": [],
        "taps": {
          "gas": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.72,
            "sourceIds": []
          },
          "liquid": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.12,
            "sourceIds": []
          }
        },
        "graftSlots": [],
        "provenance": "site"
      }
    },
    "connections": {
      "site_route_1:west_intake__gallery": {
        "id": "site_route_1:west_intake__gallery",
        "rooms": [
          "west_intake",
          "gallery"
        ],
        "hostRoomId": "west_intake",
        "defaultOpen": true,
        "defaultSealed": false,
        "sealGroupId": "site_seal:site_route_1:west_intake__gallery",
        "gasConductance": 0.22,
        "liquidConductance": 0.24,
        "aperture": 1,
        "kind": "passage",
        "connectorCells": [
          {
            "column": 59,
            "elevation": 0
          }
        ],
        "endpoints": [
          {
            "column": 58,
            "elevation": 0
          },
          {
            "column": 60,
            "elevation": 0
          }
        ],
        "orientation": "horizontal",
        "sillElevation": 0,
        "liquidMode": "spill"
      },
      "site_route_2:gallery__switchyard": {
        "id": "site_route_2:gallery__switchyard",
        "rooms": [
          "gallery",
          "switchyard"
        ],
        "hostRoomId": "gallery",
        "defaultOpen": true,
        "defaultSealed": false,
        "sealGroupId": "site_seal:site_route_2:gallery__switchyard",
        "gasConductance": 0.22,
        "liquidConductance": 0.24,
        "aperture": 1,
        "kind": "passage",
        "connectorCells": [
          {
            "column": 73,
            "elevation": 0
          }
        ],
        "endpoints": [
          {
            "column": 72,
            "elevation": 0
          },
          {
            "column": 74,
            "elevation": 0
          }
        ],
        "orientation": "horizontal",
        "sillElevation": 0,
        "liquidMode": "spill"
      },
      "site_route_3:switchyard__reservoir": {
        "id": "site_route_3:switchyard__reservoir",
        "rooms": [
          "switchyard",
          "reservoir"
        ],
        "hostRoomId": "switchyard",
        "defaultOpen": true,
        "defaultSealed": false,
        "sealGroupId": "site_seal:site_route_3:switchyard__reservoir",
        "gasConductance": 0.22,
        "liquidConductance": 0.24,
        "aperture": 1,
        "kind": "ladder_shaft",
        "connectorCells": [
          {
            "column": 80,
            "elevation": 15
          }
        ],
        "endpoints": [
          {
            "column": 80,
            "elevation": 14
          },
          {
            "column": 80,
            "elevation": 16
          }
        ],
        "orientation": "vertical",
        "sillElevation": 15,
        "liquidMode": "drain"
      },
      "site_route_4:reservoir__furnace": {
        "id": "site_route_4:reservoir__furnace",
        "rooms": [
          "reservoir",
          "furnace"
        ],
        "hostRoomId": "reservoir",
        "defaultOpen": true,
        "defaultSealed": false,
        "sealGroupId": "site_seal:site_route_4:reservoir__furnace",
        "gasConductance": 0.22,
        "liquidConductance": 0.24,
        "aperture": 1,
        "kind": "passage",
        "connectorCells": [
          {
            "column": 88,
            "elevation": 16
          }
        ],
        "endpoints": [
          {
            "column": 87,
            "elevation": 16
          },
          {
            "column": 89,
            "elevation": 16
          }
        ],
        "orientation": "horizontal",
        "sillElevation": 16,
        "liquidMode": "spill"
      },
      "site_route_5:furnace__lower_intake": {
        "id": "site_route_5:furnace__lower_intake",
        "rooms": [
          "furnace",
          "lower_intake"
        ],
        "hostRoomId": "lower_intake",
        "defaultOpen": true,
        "defaultSealed": false,
        "sealGroupId": "site_seal:site_route_5:furnace__lower_intake",
        "gasConductance": 0.22,
        "liquidConductance": 0.24,
        "aperture": 1,
        "kind": "ladder_shaft",
        "connectorCells": [
          {
            "column": 96,
            "elevation": 15
          }
        ],
        "endpoints": [
          {
            "column": 96,
            "elevation": 16
          },
          {
            "column": 96,
            "elevation": 14
          }
        ],
        "orientation": "vertical",
        "sillElevation": 15,
        "liquidMode": "drain"
      },
      "site_route_6:lower_intake__washlock": {
        "id": "site_route_6:lower_intake__washlock",
        "rooms": [
          "lower_intake",
          "washlock"
        ],
        "hostRoomId": "lower_intake",
        "defaultOpen": true,
        "defaultSealed": false,
        "sealGroupId": "site_seal:site_route_6:lower_intake__washlock",
        "gasConductance": 0.22,
        "liquidConductance": 0.24,
        "aperture": 1,
        "kind": "passage",
        "connectorCells": [
          {
            "column": 105,
            "elevation": 4
          }
        ],
        "endpoints": [
          {
            "column": 104,
            "elevation": 4
          },
          {
            "column": 106,
            "elevation": 4
          }
        ],
        "orientation": "horizontal",
        "sillElevation": 4,
        "liquidMode": "spill"
      },
      "washlock_to_core_door": {
        "id": "washlock_to_core_door",
        "kind": "core_door",
        "rooms": [
          "washlock",
          "core"
        ],
        "connectorCells": [
          {
            "column": 125,
            "elevation": 4
          },
          {
            "column": 126,
            "elevation": 4
          }
        ],
        "endpoints": [
          {
            "column": 124,
            "elevation": 4
          },
          {
            "column": 127,
            "elevation": 4
          }
        ],
        "orientation": "horizontal",
        "sillElevation": 4,
        "aperture": 2,
        "gasConductance": 0,
        "liquidConductance": 0,
        "liquidMode": "blocked",
        "hostRoomId": "washlock",
        "defaultOpen": false,
        "defaultSealed": true,
        "sealGroupId": null
      }
    },
    "utilityNodes": {
      "gas_reservoir": {
        "cell": {
          "column": 130,
          "elevation": 16
        },
        "hostRoomId": "core"
      },
      "hazard_gas_reservoir": {
        "cell": {
          "column": 109,
          "elevation": 6
        },
        "hostRoomId": "washlock"
      },
      "liquid_reservoir_a": {
        "cell": {
          "column": 130,
          "elevation": 6
        },
        "hostRoomId": "core"
      },
      "liquid_reservoir_b": {
        "cell": {
          "column": 134,
          "elevation": 6
        },
        "hostRoomId": "core"
      },
      "hazard_liquid_reservoir": {
        "cell": {
          "column": 118,
          "elevation": 6
        },
        "hostRoomId": "washlock"
      },
      "gas_vent": {
        "cell": {
          "column": 140,
          "elevation": 16
        },
        "hostRoomId": "core"
      },
      "liquid_drain": {
        "cell": {
          "column": 140,
          "elevation": 6
        },
        "hostRoomId": "core"
      },
      "specialty_gas_reservoir": {
        "cell": {
          "column": 75,
          "elevation": 18
        },
        "hostRoomId": "reservoir"
      }
    }
  },
  "vasker_store": {
    "width": 176,
    "height": 68,
    "cellSize": 16,
    "ringRadii": {
      "inner": 30,
      "middle": 58
    },
    "coreAnchor": {
      "column": 140,
      "elevation": 12
    },
    "coreBreachCell": {
      "column": 129,
      "elevation": 4
    },
    "entryCell": {
      "column": 47,
      "elevation": 9
    },
    "routeGraph": {
      "coreNodeId": "core",
      "nodes": {
        "ingress:entry_to_core": {
          "id": "ingress:entry_to_core",
          "kind": "ingress",
          "cell": {
            "column": 47,
            "elevation": 9
          }
        },
        "core": {
          "id": "core",
          "kind": "core",
          "cell": {
            "column": 129,
            "elevation": 4
          }
        }
      },
      "edges": {},
      "routes": {
        "entry_to_core": {
          "id": "entry_to_core",
          "ingressNodeId": "ingress:entry_to_core",
          "edgeIds": [],
          "authoredOrder": 0
        }
      }
    },
    "rooms": {
      "washlock": {
        "id": "washlock",
        "code": "R-06",
        "structure": "room",
        "ambientTemperature": 22,
        "socketCount": 2,
        "bounds": {
          "column": 110,
          "elevation": 4,
          "width": 19,
          "height": 9
        },
        "socketCells": {
          "socket_a": {
            "column": 115,
            "elevation": 4
          },
          "socket_b": {
            "column": 125,
            "elevation": 4
          }
        },
        "platformCells": [],
        "ladderCells": [
          {
            "column": 119,
            "elevation": 4
          },
          {
            "column": 119,
            "elevation": 5
          },
          {
            "column": 119,
            "elevation": 6
          },
          {
            "column": 119,
            "elevation": 7
          },
          {
            "column": 119,
            "elevation": 8
          },
          {
            "column": 119,
            "elevation": 9
          },
          {
            "column": 119,
            "elevation": 10
          },
          {
            "column": 119,
            "elevation": 11
          },
          {
            "column": 119,
            "elevation": 12
          }
        ],
        "taps": {
          "gas": {
            "capacity": 18,
            "includeRoomInventory": false,
            "roomPortHeight": 0.72,
            "sourceIds": [
              "hazard_gas_reservoir"
            ]
          },
          "liquid": {
            "capacity": 20,
            "includeRoomInventory": false,
            "roomPortHeight": 0.12,
            "sourceIds": [
              "hazard_liquid_reservoir"
            ]
          }
        },
        "graftSlots": [
          {
            "id": "forward",
            "cell": {
              "column": 110,
              "elevation": 4
            },
            "facing": "left"
          },
          {
            "id": "upper",
            "cell": {
              "column": 119,
              "elevation": 12
            },
            "facing": "up"
          }
        ],
        "provenance": "hull"
      },
      "core": {
        "id": "core",
        "code": "CORE",
        "structure": "core",
        "ambientTemperature": 26,
        "socketCount": 0,
        "bounds": {
          "column": 131,
          "elevation": 4,
          "width": 18,
          "height": 16
        },
        "socketCells": {},
        "platformCells": [],
        "ladderCells": [],
        "taps": {
          "gas": {
            "capacity": 24,
            "includeRoomInventory": false,
            "roomPortHeight": 0.72,
            "sourceIds": [
              "gas_reservoir"
            ]
          },
          "liquid": {
            "capacity": 28,
            "includeRoomInventory": false,
            "roomPortHeight": 0.12,
            "sourceIds": [
              "liquid_reservoir_a",
              "liquid_reservoir_b"
            ]
          }
        },
        "graftSlots": [],
        "provenance": "hull"
      },
      "lower_intake": {
        "id": "lower_intake",
        "code": "VS-05",
        "structure": "room",
        "ambientTemperature": 22,
        "socketCount": 2,
        "bounds": {
          "column": 91,
          "elevation": 4,
          "width": 18,
          "height": 12
        },
        "socketCells": {
          "socket_a": {
            "column": 97,
            "elevation": 4
          },
          "socket_b": {
            "column": 103,
            "elevation": 4
          }
        },
        "platformCells": [],
        "ladderCells": [],
        "taps": {
          "gas": {
            "capacity": 34,
            "includeRoomInventory": true,
            "roomPortHeight": 0.72,
            "sourceIds": []
          },
          "liquid": {
            "capacity": 28,
            "includeRoomInventory": true,
            "roomPortHeight": 0.12,
            "sourceIds": []
          }
        },
        "graftSlots": [],
        "provenance": "site"
      },
      "furnace": {
        "id": "furnace",
        "code": "VS-02",
        "structure": "room",
        "ambientTemperature": 22,
        "socketCount": 2,
        "bounds": {
          "column": 76,
          "elevation": 4,
          "width": 14,
          "height": 16
        },
        "socketCells": {
          "socket_a": {
            "column": 80,
            "elevation": 4
          },
          "socket_b": {
            "column": 86,
            "elevation": 4
          }
        },
        "platformCells": [],
        "ladderCells": [
          {
            "column": 82,
            "elevation": 4
          },
          {
            "column": 82,
            "elevation": 5
          },
          {
            "column": 82,
            "elevation": 6
          },
          {
            "column": 82,
            "elevation": 7
          },
          {
            "column": 82,
            "elevation": 8
          },
          {
            "column": 82,
            "elevation": 9
          },
          {
            "column": 82,
            "elevation": 10
          },
          {
            "column": 82,
            "elevation": 11
          },
          {
            "column": 82,
            "elevation": 12
          },
          {
            "column": 82,
            "elevation": 13
          },
          {
            "column": 82,
            "elevation": 14
          },
          {
            "column": 82,
            "elevation": 15
          },
          {
            "column": 82,
            "elevation": 16
          },
          {
            "column": 82,
            "elevation": 17
          },
          {
            "column": 82,
            "elevation": 18
          },
          {
            "column": 82,
            "elevation": 19
          }
        ],
        "taps": {
          "gas": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.72,
            "sourceIds": []
          },
          "liquid": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.12,
            "sourceIds": []
          }
        },
        "graftSlots": [],
        "provenance": "site"
      },
      "gallery": {
        "id": "gallery",
        "code": "VS-04",
        "structure": "room",
        "ambientTemperature": 22,
        "socketCount": 2,
        "bounds": {
          "column": 76,
          "elevation": 21,
          "width": 15,
          "height": 15
        },
        "socketCells": {
          "socket_a": {
            "column": 81,
            "elevation": 21
          },
          "socket_b": {
            "column": 86,
            "elevation": 21
          }
        },
        "platformCells": [],
        "ladderCells": [
          {
            "column": 82,
            "elevation": 21
          },
          {
            "column": 82,
            "elevation": 22
          },
          {
            "column": 82,
            "elevation": 23
          },
          {
            "column": 82,
            "elevation": 24
          },
          {
            "column": 82,
            "elevation": 25
          },
          {
            "column": 82,
            "elevation": 26
          },
          {
            "column": 82,
            "elevation": 27
          },
          {
            "column": 82,
            "elevation": 28
          },
          {
            "column": 82,
            "elevation": 29
          },
          {
            "column": 82,
            "elevation": 30
          },
          {
            "column": 82,
            "elevation": 31
          },
          {
            "column": 82,
            "elevation": 32
          },
          {
            "column": 82,
            "elevation": 33
          },
          {
            "column": 82,
            "elevation": 34
          },
          {
            "column": 82,
            "elevation": 35
          }
        ],
        "taps": {
          "gas": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.72,
            "sourceIds": []
          },
          "liquid": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.12,
            "sourceIds": []
          }
        },
        "graftSlots": [],
        "provenance": "site"
      },
      "switchyard": {
        "id": "switchyard",
        "code": "VS-01",
        "structure": "room",
        "ambientTemperature": 22,
        "socketCount": 2,
        "bounds": {
          "column": 56,
          "elevation": 21,
          "width": 19,
          "height": 10
        },
        "socketCells": {
          "socket_a": {
            "column": 62,
            "elevation": 21
          },
          "socket_b": {
            "column": 69,
            "elevation": 21
          }
        },
        "platformCells": [],
        "ladderCells": [
          {
            "column": 65,
            "elevation": 21
          },
          {
            "column": 65,
            "elevation": 22
          },
          {
            "column": 65,
            "elevation": 23
          },
          {
            "column": 65,
            "elevation": 24
          },
          {
            "column": 65,
            "elevation": 25
          },
          {
            "column": 65,
            "elevation": 26
          },
          {
            "column": 65,
            "elevation": 27
          },
          {
            "column": 65,
            "elevation": 28
          },
          {
            "column": 65,
            "elevation": 29
          },
          {
            "column": 65,
            "elevation": 30
          }
        ],
        "taps": {
          "gas": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.72,
            "sourceIds": []
          },
          "liquid": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.12,
            "sourceIds": []
          }
        },
        "graftSlots": [],
        "provenance": "site"
      },
      "reservoir": {
        "id": "reservoir",
        "code": "VS-03",
        "structure": "room",
        "ambientTemperature": 22,
        "socketCount": 2,
        "bounds": {
          "column": 53,
          "elevation": 9,
          "width": 22,
          "height": 11
        },
        "socketCells": {
          "socket_a": {
            "column": 60,
            "elevation": 9
          },
          "socket_b": {
            "column": 68,
            "elevation": 9
          }
        },
        "platformCells": [],
        "ladderCells": [
          {
            "column": 65,
            "elevation": 9
          },
          {
            "column": 65,
            "elevation": 10
          },
          {
            "column": 65,
            "elevation": 11
          },
          {
            "column": 65,
            "elevation": 12
          },
          {
            "column": 65,
            "elevation": 13
          },
          {
            "column": 65,
            "elevation": 14
          },
          {
            "column": 65,
            "elevation": 15
          },
          {
            "column": 65,
            "elevation": 16
          },
          {
            "column": 65,
            "elevation": 17
          },
          {
            "column": 65,
            "elevation": 18
          },
          {
            "column": 65,
            "elevation": 19
          }
        ],
        "taps": {
          "gas": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.72,
            "sourceIds": [
              "specialty_gas_reservoir"
            ]
          },
          "liquid": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.12,
            "sourceIds": []
          }
        },
        "graftSlots": [],
        "provenance": "site"
      },
      "west_intake": {
        "id": "west_intake",
        "code": "VS-00",
        "structure": "entry",
        "ambientTemperature": 22,
        "socketCount": 0,
        "bounds": {
          "column": 47,
          "elevation": 9,
          "width": 5,
          "height": 9
        },
        "socketCells": {},
        "platformCells": [],
        "ladderCells": [],
        "taps": {
          "gas": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.72,
            "sourceIds": []
          },
          "liquid": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.12,
            "sourceIds": []
          }
        },
        "graftSlots": [],
        "provenance": "site"
      }
    },
    "connections": {
      "site_route_1:west_intake__reservoir": {
        "id": "site_route_1:west_intake__reservoir",
        "rooms": [
          "west_intake",
          "reservoir"
        ],
        "hostRoomId": "west_intake",
        "defaultOpen": true,
        "defaultSealed": false,
        "sealGroupId": "site_seal:site_route_1:west_intake__reservoir",
        "gasConductance": 0.22,
        "liquidConductance": 0.24,
        "aperture": 1,
        "kind": "passage",
        "connectorCells": [
          {
            "column": 52,
            "elevation": 9
          }
        ],
        "endpoints": [
          {
            "column": 51,
            "elevation": 9
          },
          {
            "column": 53,
            "elevation": 9
          }
        ],
        "orientation": "horizontal",
        "sillElevation": 9,
        "liquidMode": "spill"
      },
      "site_route_2:reservoir__switchyard": {
        "id": "site_route_2:reservoir__switchyard",
        "rooms": [
          "reservoir",
          "switchyard"
        ],
        "hostRoomId": "reservoir",
        "defaultOpen": true,
        "defaultSealed": false,
        "sealGroupId": "site_seal:site_route_2:reservoir__switchyard",
        "gasConductance": 0.22,
        "liquidConductance": 0.24,
        "aperture": 1,
        "kind": "ladder_shaft",
        "connectorCells": [
          {
            "column": 65,
            "elevation": 20
          }
        ],
        "endpoints": [
          {
            "column": 65,
            "elevation": 19
          },
          {
            "column": 65,
            "elevation": 21
          }
        ],
        "orientation": "vertical",
        "sillElevation": 20,
        "liquidMode": "drain"
      },
      "site_route_3:switchyard__gallery": {
        "id": "site_route_3:switchyard__gallery",
        "rooms": [
          "switchyard",
          "gallery"
        ],
        "hostRoomId": "switchyard",
        "defaultOpen": true,
        "defaultSealed": false,
        "sealGroupId": "site_seal:site_route_3:switchyard__gallery",
        "gasConductance": 0.22,
        "liquidConductance": 0.24,
        "aperture": 1,
        "kind": "passage",
        "connectorCells": [
          {
            "column": 75,
            "elevation": 21
          }
        ],
        "endpoints": [
          {
            "column": 74,
            "elevation": 21
          },
          {
            "column": 76,
            "elevation": 21
          }
        ],
        "orientation": "horizontal",
        "sillElevation": 21,
        "liquidMode": "spill"
      },
      "site_route_4:gallery__furnace": {
        "id": "site_route_4:gallery__furnace",
        "rooms": [
          "gallery",
          "furnace"
        ],
        "hostRoomId": "furnace",
        "defaultOpen": true,
        "defaultSealed": false,
        "sealGroupId": "site_seal:site_route_4:gallery__furnace",
        "gasConductance": 0.22,
        "liquidConductance": 0.24,
        "aperture": 1,
        "kind": "ladder_shaft",
        "connectorCells": [
          {
            "column": 82,
            "elevation": 20
          }
        ],
        "endpoints": [
          {
            "column": 82,
            "elevation": 21
          },
          {
            "column": 82,
            "elevation": 19
          }
        ],
        "orientation": "vertical",
        "sillElevation": 20,
        "liquidMode": "drain"
      },
      "site_route_5:furnace__lower_intake": {
        "id": "site_route_5:furnace__lower_intake",
        "rooms": [
          "furnace",
          "lower_intake"
        ],
        "hostRoomId": "furnace",
        "defaultOpen": true,
        "defaultSealed": false,
        "sealGroupId": "site_seal:site_route_5:furnace__lower_intake",
        "gasConductance": 0.22,
        "liquidConductance": 0.24,
        "aperture": 1,
        "kind": "passage",
        "connectorCells": [
          {
            "column": 90,
            "elevation": 4
          }
        ],
        "endpoints": [
          {
            "column": 89,
            "elevation": 4
          },
          {
            "column": 91,
            "elevation": 4
          }
        ],
        "orientation": "horizontal",
        "sillElevation": 4,
        "liquidMode": "spill"
      },
      "site_route_6:lower_intake__washlock": {
        "id": "site_route_6:lower_intake__washlock",
        "rooms": [
          "lower_intake",
          "washlock"
        ],
        "hostRoomId": "lower_intake",
        "defaultOpen": true,
        "defaultSealed": false,
        "sealGroupId": "site_seal:site_route_6:lower_intake__washlock",
        "gasConductance": 0.22,
        "liquidConductance": 0.24,
        "aperture": 1,
        "kind": "passage",
        "connectorCells": [
          {
            "column": 109,
            "elevation": 4
          }
        ],
        "endpoints": [
          {
            "column": 108,
            "elevation": 4
          },
          {
            "column": 110,
            "elevation": 4
          }
        ],
        "orientation": "horizontal",
        "sillElevation": 4,
        "liquidMode": "spill"
      },
      "washlock_to_core_door": {
        "id": "washlock_to_core_door",
        "kind": "core_door",
        "rooms": [
          "washlock",
          "core"
        ],
        "connectorCells": [
          {
            "column": 129,
            "elevation": 4
          },
          {
            "column": 130,
            "elevation": 4
          }
        ],
        "endpoints": [
          {
            "column": 128,
            "elevation": 4
          },
          {
            "column": 131,
            "elevation": 4
          }
        ],
        "orientation": "horizontal",
        "sillElevation": 4,
        "aperture": 2,
        "gasConductance": 0,
        "liquidConductance": 0,
        "liquidMode": "blocked",
        "hostRoomId": "washlock",
        "defaultOpen": false,
        "defaultSealed": true,
        "sealGroupId": null
      }
    },
    "utilityNodes": {
      "gas_reservoir": {
        "cell": {
          "column": 134,
          "elevation": 16
        },
        "hostRoomId": "core"
      },
      "hazard_gas_reservoir": {
        "cell": {
          "column": 113,
          "elevation": 6
        },
        "hostRoomId": "washlock"
      },
      "liquid_reservoir_a": {
        "cell": {
          "column": 134,
          "elevation": 6
        },
        "hostRoomId": "core"
      },
      "liquid_reservoir_b": {
        "cell": {
          "column": 138,
          "elevation": 6
        },
        "hostRoomId": "core"
      },
      "hazard_liquid_reservoir": {
        "cell": {
          "column": 122,
          "elevation": 6
        },
        "hostRoomId": "washlock"
      },
      "gas_vent": {
        "cell": {
          "column": 144,
          "elevation": 16
        },
        "hostRoomId": "core"
      },
      "liquid_drain": {
        "cell": {
          "column": 144,
          "elevation": 6
        },
        "hostRoomId": "core"
      },
      "specialty_gas_reservoir": {
        "cell": {
          "column": 55,
          "elevation": 11
        },
        "hostRoomId": "reservoir"
      }
    }
  },
  "lane_six": {
    "width": 176,
    "height": 68,
    "cellSize": 16,
    "ringRadii": {
      "inner": 30,
      "middle": 58
    },
    "coreAnchor": {
      "column": 144,
      "elevation": 12
    },
    "coreBreachCell": {
      "column": 133,
      "elevation": 4
    },
    "entryCell": {
      "column": 37,
      "elevation": 3
    },
    "routeGraph": {
      "coreNodeId": "core",
      "nodes": {
        "ingress:entry_to_core": {
          "id": "ingress:entry_to_core",
          "kind": "ingress",
          "cell": {
            "column": 37,
            "elevation": 3
          }
        },
        "core": {
          "id": "core",
          "kind": "core",
          "cell": {
            "column": 133,
            "elevation": 4
          }
        }
      },
      "edges": {},
      "routes": {
        "entry_to_core": {
          "id": "entry_to_core",
          "ingressNodeId": "ingress:entry_to_core",
          "edgeIds": [],
          "authoredOrder": 0
        }
      }
    },
    "rooms": {
      "washlock": {
        "id": "washlock",
        "code": "R-06",
        "structure": "room",
        "ambientTemperature": 22,
        "socketCount": 2,
        "bounds": {
          "column": 114,
          "elevation": 4,
          "width": 19,
          "height": 9
        },
        "socketCells": {
          "socket_a": {
            "column": 119,
            "elevation": 4
          },
          "socket_b": {
            "column": 129,
            "elevation": 4
          }
        },
        "platformCells": [],
        "ladderCells": [
          {
            "column": 123,
            "elevation": 4
          },
          {
            "column": 123,
            "elevation": 5
          },
          {
            "column": 123,
            "elevation": 6
          },
          {
            "column": 123,
            "elevation": 7
          },
          {
            "column": 123,
            "elevation": 8
          },
          {
            "column": 123,
            "elevation": 9
          },
          {
            "column": 123,
            "elevation": 10
          },
          {
            "column": 123,
            "elevation": 11
          },
          {
            "column": 123,
            "elevation": 12
          }
        ],
        "taps": {
          "gas": {
            "capacity": 18,
            "includeRoomInventory": false,
            "roomPortHeight": 0.72,
            "sourceIds": [
              "hazard_gas_reservoir"
            ]
          },
          "liquid": {
            "capacity": 20,
            "includeRoomInventory": false,
            "roomPortHeight": 0.12,
            "sourceIds": [
              "hazard_liquid_reservoir"
            ]
          }
        },
        "graftSlots": [
          {
            "id": "forward",
            "cell": {
              "column": 114,
              "elevation": 4
            },
            "facing": "left"
          },
          {
            "id": "upper",
            "cell": {
              "column": 123,
              "elevation": 12
            },
            "facing": "up"
          }
        ],
        "provenance": "hull"
      },
      "core": {
        "id": "core",
        "code": "CORE",
        "structure": "core",
        "ambientTemperature": 26,
        "socketCount": 0,
        "bounds": {
          "column": 135,
          "elevation": 4,
          "width": 18,
          "height": 16
        },
        "socketCells": {},
        "platformCells": [],
        "ladderCells": [],
        "taps": {
          "gas": {
            "capacity": 24,
            "includeRoomInventory": false,
            "roomPortHeight": 0.72,
            "sourceIds": [
              "gas_reservoir"
            ]
          },
          "liquid": {
            "capacity": 28,
            "includeRoomInventory": false,
            "roomPortHeight": 0.12,
            "sourceIds": [
              "liquid_reservoir_a",
              "liquid_reservoir_b"
            ]
          }
        },
        "graftSlots": [],
        "provenance": "hull"
      },
      "lower_intake": {
        "id": "lower_intake",
        "code": "L6C-5",
        "structure": "room",
        "ambientTemperature": 22,
        "socketCount": 2,
        "bounds": {
          "column": 92,
          "elevation": 4,
          "width": 21,
          "height": 10
        },
        "socketCells": {
          "socket_a": {
            "column": 99,
            "elevation": 4
          },
          "socket_b": {
            "column": 107,
            "elevation": 4
          }
        },
        "platformCells": [],
        "ladderCells": [
          {
            "column": 102,
            "elevation": 4
          },
          {
            "column": 102,
            "elevation": 5
          },
          {
            "column": 102,
            "elevation": 6
          },
          {
            "column": 102,
            "elevation": 7
          },
          {
            "column": 102,
            "elevation": 8
          },
          {
            "column": 102,
            "elevation": 9
          },
          {
            "column": 102,
            "elevation": 10
          },
          {
            "column": 102,
            "elevation": 11
          },
          {
            "column": 102,
            "elevation": 12
          },
          {
            "column": 102,
            "elevation": 13
          }
        ],
        "taps": {
          "gas": {
            "capacity": 36,
            "includeRoomInventory": true,
            "roomPortHeight": 0.72,
            "sourceIds": []
          },
          "liquid": {
            "capacity": 30,
            "includeRoomInventory": true,
            "roomPortHeight": 0.12,
            "sourceIds": []
          }
        },
        "graftSlots": [],
        "provenance": "site"
      },
      "reservoir": {
        "id": "reservoir",
        "code": "L6C-3",
        "structure": "room",
        "ambientTemperature": 22,
        "socketCount": 2,
        "bounds": {
          "column": 90,
          "elevation": 15,
          "width": 24,
          "height": 10
        },
        "socketCells": {
          "socket_a": {
            "column": 98,
            "elevation": 15
          },
          "socket_b": {
            "column": 107,
            "elevation": 15
          }
        },
        "platformCells": [],
        "ladderCells": [
          {
            "column": 102,
            "elevation": 15
          },
          {
            "column": 102,
            "elevation": 16
          },
          {
            "column": 102,
            "elevation": 17
          },
          {
            "column": 102,
            "elevation": 18
          },
          {
            "column": 102,
            "elevation": 19
          },
          {
            "column": 102,
            "elevation": 20
          },
          {
            "column": 102,
            "elevation": 21
          },
          {
            "column": 102,
            "elevation": 22
          },
          {
            "column": 102,
            "elevation": 23
          },
          {
            "column": 102,
            "elevation": 24
          }
        ],
        "taps": {
          "gas": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.72,
            "sourceIds": [
              "specialty_gas_reservoir"
            ]
          },
          "liquid": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.12,
            "sourceIds": []
          }
        },
        "graftSlots": [],
        "provenance": "site"
      },
      "gallery": {
        "id": "gallery",
        "code": "L6C-4",
        "structure": "room",
        "ambientTemperature": 22,
        "socketCount": 2,
        "bounds": {
          "column": 67,
          "elevation": 15,
          "width": 22,
          "height": 11
        },
        "socketCells": {
          "socket_a": {
            "column": 74,
            "elevation": 15
          },
          "socket_b": {
            "column": 82,
            "elevation": 15
          }
        },
        "platformCells": [],
        "ladderCells": [
          {
            "column": 77,
            "elevation": 15
          },
          {
            "column": 77,
            "elevation": 16
          },
          {
            "column": 77,
            "elevation": 17
          },
          {
            "column": 77,
            "elevation": 18
          },
          {
            "column": 77,
            "elevation": 19
          },
          {
            "column": 77,
            "elevation": 20
          },
          {
            "column": 77,
            "elevation": 21
          },
          {
            "column": 77,
            "elevation": 22
          },
          {
            "column": 77,
            "elevation": 23
          },
          {
            "column": 77,
            "elevation": 24
          },
          {
            "column": 77,
            "elevation": 25
          }
        ],
        "taps": {
          "gas": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.72,
            "sourceIds": []
          },
          "liquid": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.12,
            "sourceIds": []
          }
        },
        "graftSlots": [],
        "provenance": "site"
      },
      "furnace": {
        "id": "furnace",
        "code": "L6C-2",
        "structure": "room",
        "ambientTemperature": 22,
        "socketCount": 2,
        "bounds": {
          "column": 67,
          "elevation": 3,
          "width": 22,
          "height": 11
        },
        "socketCells": {
          "socket_a": {
            "column": 74,
            "elevation": 3
          },
          "socket_b": {
            "column": 82,
            "elevation": 3
          }
        },
        "platformCells": [],
        "ladderCells": [
          {
            "column": 77,
            "elevation": 3
          },
          {
            "column": 77,
            "elevation": 4
          },
          {
            "column": 77,
            "elevation": 5
          },
          {
            "column": 77,
            "elevation": 6
          },
          {
            "column": 77,
            "elevation": 7
          },
          {
            "column": 77,
            "elevation": 8
          },
          {
            "column": 77,
            "elevation": 9
          },
          {
            "column": 77,
            "elevation": 10
          },
          {
            "column": 77,
            "elevation": 11
          },
          {
            "column": 77,
            "elevation": 12
          },
          {
            "column": 77,
            "elevation": 13
          }
        ],
        "taps": {
          "gas": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.72,
            "sourceIds": []
          },
          "liquid": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.12,
            "sourceIds": []
          }
        },
        "graftSlots": [],
        "provenance": "site"
      },
      "switchyard": {
        "id": "switchyard",
        "code": "L6C-1",
        "structure": "room",
        "ambientTemperature": 22,
        "socketCount": 2,
        "bounds": {
          "column": 43,
          "elevation": 3,
          "width": 23,
          "height": 10
        },
        "socketCells": {
          "socket_a": {
            "column": 50,
            "elevation": 3
          },
          "socket_b": {
            "column": 59,
            "elevation": 3
          }
        },
        "platformCells": [],
        "ladderCells": [],
        "taps": {
          "gas": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.72,
            "sourceIds": []
          },
          "liquid": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.12,
            "sourceIds": []
          }
        },
        "graftSlots": [],
        "provenance": "site"
      },
      "west_intake": {
        "id": "west_intake",
        "code": "L6C-0",
        "structure": "entry",
        "ambientTemperature": 22,
        "socketCount": 0,
        "bounds": {
          "column": 37,
          "elevation": 3,
          "width": 5,
          "height": 10
        },
        "socketCells": {},
        "platformCells": [],
        "ladderCells": [],
        "taps": {
          "gas": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.72,
            "sourceIds": []
          },
          "liquid": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.12,
            "sourceIds": []
          }
        },
        "graftSlots": [],
        "provenance": "site"
      }
    },
    "connections": {
      "site_route_1:west_intake__switchyard": {
        "id": "site_route_1:west_intake__switchyard",
        "rooms": [
          "west_intake",
          "switchyard"
        ],
        "hostRoomId": "west_intake",
        "defaultOpen": true,
        "defaultSealed": false,
        "sealGroupId": "site_seal:site_route_1:west_intake__switchyard",
        "gasConductance": 0.22,
        "liquidConductance": 0.24,
        "aperture": 1,
        "kind": "passage",
        "connectorCells": [
          {
            "column": 42,
            "elevation": 3
          }
        ],
        "endpoints": [
          {
            "column": 41,
            "elevation": 3
          },
          {
            "column": 43,
            "elevation": 3
          }
        ],
        "orientation": "horizontal",
        "sillElevation": 3,
        "liquidMode": "spill"
      },
      "site_route_2:switchyard__furnace": {
        "id": "site_route_2:switchyard__furnace",
        "rooms": [
          "switchyard",
          "furnace"
        ],
        "hostRoomId": "switchyard",
        "defaultOpen": true,
        "defaultSealed": false,
        "sealGroupId": "site_seal:site_route_2:switchyard__furnace",
        "gasConductance": 0.22,
        "liquidConductance": 0.24,
        "aperture": 1,
        "kind": "passage",
        "connectorCells": [
          {
            "column": 66,
            "elevation": 3
          }
        ],
        "endpoints": [
          {
            "column": 65,
            "elevation": 3
          },
          {
            "column": 67,
            "elevation": 3
          }
        ],
        "orientation": "horizontal",
        "sillElevation": 3,
        "liquidMode": "spill"
      },
      "site_route_3:furnace__gallery": {
        "id": "site_route_3:furnace__gallery",
        "rooms": [
          "furnace",
          "gallery"
        ],
        "hostRoomId": "furnace",
        "defaultOpen": true,
        "defaultSealed": false,
        "sealGroupId": "site_seal:site_route_3:furnace__gallery",
        "gasConductance": 0.22,
        "liquidConductance": 0.24,
        "aperture": 1,
        "kind": "ladder_shaft",
        "connectorCells": [
          {
            "column": 77,
            "elevation": 14
          }
        ],
        "endpoints": [
          {
            "column": 77,
            "elevation": 13
          },
          {
            "column": 77,
            "elevation": 15
          }
        ],
        "orientation": "vertical",
        "sillElevation": 14,
        "liquidMode": "drain"
      },
      "site_route_4:gallery__reservoir": {
        "id": "site_route_4:gallery__reservoir",
        "rooms": [
          "gallery",
          "reservoir"
        ],
        "hostRoomId": "gallery",
        "defaultOpen": true,
        "defaultSealed": false,
        "sealGroupId": "site_seal:site_route_4:gallery__reservoir",
        "gasConductance": 0.22,
        "liquidConductance": 0.24,
        "aperture": 1,
        "kind": "passage",
        "connectorCells": [
          {
            "column": 89,
            "elevation": 15
          }
        ],
        "endpoints": [
          {
            "column": 88,
            "elevation": 15
          },
          {
            "column": 90,
            "elevation": 15
          }
        ],
        "orientation": "horizontal",
        "sillElevation": 15,
        "liquidMode": "spill"
      },
      "site_route_5:reservoir__lower_intake": {
        "id": "site_route_5:reservoir__lower_intake",
        "rooms": [
          "reservoir",
          "lower_intake"
        ],
        "hostRoomId": "lower_intake",
        "defaultOpen": true,
        "defaultSealed": false,
        "sealGroupId": "site_seal:site_route_5:reservoir__lower_intake",
        "gasConductance": 0.22,
        "liquidConductance": 0.24,
        "aperture": 1,
        "kind": "ladder_shaft",
        "connectorCells": [
          {
            "column": 102,
            "elevation": 14
          }
        ],
        "endpoints": [
          {
            "column": 102,
            "elevation": 15
          },
          {
            "column": 102,
            "elevation": 13
          }
        ],
        "orientation": "vertical",
        "sillElevation": 14,
        "liquidMode": "drain"
      },
      "site_route_6:lower_intake__washlock": {
        "id": "site_route_6:lower_intake__washlock",
        "rooms": [
          "lower_intake",
          "washlock"
        ],
        "hostRoomId": "lower_intake",
        "defaultOpen": true,
        "defaultSealed": false,
        "sealGroupId": "site_seal:site_route_6:lower_intake__washlock",
        "gasConductance": 0.22,
        "liquidConductance": 0.24,
        "aperture": 1,
        "kind": "passage",
        "connectorCells": [
          {
            "column": 113,
            "elevation": 4
          }
        ],
        "endpoints": [
          {
            "column": 112,
            "elevation": 4
          },
          {
            "column": 114,
            "elevation": 4
          }
        ],
        "orientation": "horizontal",
        "sillElevation": 4,
        "liquidMode": "spill"
      },
      "washlock_to_core_door": {
        "id": "washlock_to_core_door",
        "kind": "core_door",
        "rooms": [
          "washlock",
          "core"
        ],
        "connectorCells": [
          {
            "column": 133,
            "elevation": 4
          },
          {
            "column": 134,
            "elevation": 4
          }
        ],
        "endpoints": [
          {
            "column": 132,
            "elevation": 4
          },
          {
            "column": 135,
            "elevation": 4
          }
        ],
        "orientation": "horizontal",
        "sillElevation": 4,
        "aperture": 2,
        "gasConductance": 0,
        "liquidConductance": 0,
        "liquidMode": "blocked",
        "hostRoomId": "washlock",
        "defaultOpen": false,
        "defaultSealed": true,
        "sealGroupId": null
      }
    },
    "utilityNodes": {
      "gas_reservoir": {
        "cell": {
          "column": 138,
          "elevation": 16
        },
        "hostRoomId": "core"
      },
      "hazard_gas_reservoir": {
        "cell": {
          "column": 117,
          "elevation": 6
        },
        "hostRoomId": "washlock"
      },
      "liquid_reservoir_a": {
        "cell": {
          "column": 138,
          "elevation": 6
        },
        "hostRoomId": "core"
      },
      "liquid_reservoir_b": {
        "cell": {
          "column": 142,
          "elevation": 6
        },
        "hostRoomId": "core"
      },
      "hazard_liquid_reservoir": {
        "cell": {
          "column": 126,
          "elevation": 6
        },
        "hostRoomId": "washlock"
      },
      "gas_vent": {
        "cell": {
          "column": 148,
          "elevation": 16
        },
        "hostRoomId": "core"
      },
      "liquid_drain": {
        "cell": {
          "column": 148,
          "elevation": 6
        },
        "hostRoomId": "core"
      },
      "specialty_gas_reservoir": {
        "cell": {
          "column": 92,
          "elevation": 17
        },
        "hostRoomId": "reservoir"
      }
    }
  },
  "pell_cordon": {
    "width": 176,
    "height": 68,
    "cellSize": 16,
    "ringRadii": {
      "inner": 30,
      "middle": 58
    },
    "coreAnchor": {
      "column": 142,
      "elevation": 12
    },
    "coreBreachCell": {
      "column": 131,
      "elevation": 4
    },
    "entryCell": {
      "column": 2,
      "elevation": 4
    },
    "routeGraph": {
      "coreNodeId": "core",
      "nodes": {
        "ingress:entry_to_core": {
          "id": "ingress:entry_to_core",
          "kind": "ingress",
          "cell": {
            "column": 2,
            "elevation": 4
          }
        },
        "core": {
          "id": "core",
          "kind": "core",
          "cell": {
            "column": 131,
            "elevation": 4
          }
        }
      },
      "edges": {},
      "routes": {
        "entry_to_core": {
          "id": "entry_to_core",
          "ingressNodeId": "ingress:entry_to_core",
          "edgeIds": [],
          "authoredOrder": 0
        }
      }
    },
    "rooms": {
      "washlock": {
        "id": "washlock",
        "code": "R-06",
        "structure": "room",
        "ambientTemperature": 22,
        "socketCount": 2,
        "bounds": {
          "column": 112,
          "elevation": 4,
          "width": 19,
          "height": 9
        },
        "socketCells": {
          "socket_a": {
            "column": 117,
            "elevation": 4
          },
          "socket_b": {
            "column": 127,
            "elevation": 4
          }
        },
        "platformCells": [],
        "ladderCells": [
          {
            "column": 121,
            "elevation": 4
          },
          {
            "column": 121,
            "elevation": 5
          },
          {
            "column": 121,
            "elevation": 6
          },
          {
            "column": 121,
            "elevation": 7
          },
          {
            "column": 121,
            "elevation": 8
          },
          {
            "column": 121,
            "elevation": 9
          },
          {
            "column": 121,
            "elevation": 10
          },
          {
            "column": 121,
            "elevation": 11
          },
          {
            "column": 121,
            "elevation": 12
          }
        ],
        "taps": {
          "gas": {
            "capacity": 18,
            "includeRoomInventory": false,
            "roomPortHeight": 0.72,
            "sourceIds": [
              "hazard_gas_reservoir"
            ]
          },
          "liquid": {
            "capacity": 20,
            "includeRoomInventory": false,
            "roomPortHeight": 0.12,
            "sourceIds": [
              "hazard_liquid_reservoir"
            ]
          }
        },
        "graftSlots": [
          {
            "id": "forward",
            "cell": {
              "column": 112,
              "elevation": 4
            },
            "facing": "left"
          },
          {
            "id": "upper",
            "cell": {
              "column": 121,
              "elevation": 12
            },
            "facing": "up"
          }
        ],
        "provenance": "hull"
      },
      "core": {
        "id": "core",
        "code": "CORE",
        "structure": "core",
        "ambientTemperature": 26,
        "socketCount": 0,
        "bounds": {
          "column": 133,
          "elevation": 4,
          "width": 18,
          "height": 16
        },
        "socketCells": {},
        "platformCells": [],
        "ladderCells": [],
        "taps": {
          "gas": {
            "capacity": 24,
            "includeRoomInventory": false,
            "roomPortHeight": 0.72,
            "sourceIds": [
              "gas_reservoir"
            ]
          },
          "liquid": {
            "capacity": 28,
            "includeRoomInventory": false,
            "roomPortHeight": 0.12,
            "sourceIds": [
              "liquid_reservoir_a",
              "liquid_reservoir_b"
            ]
          }
        },
        "graftSlots": [],
        "provenance": "hull"
      },
      "lower_intake": {
        "id": "lower_intake",
        "code": "PEL-5",
        "structure": "room",
        "ambientTemperature": 22,
        "socketCount": 2,
        "bounds": {
          "column": 91,
          "elevation": 4,
          "width": 20,
          "height": 13
        },
        "socketCells": {
          "socket_a": {
            "column": 97,
            "elevation": 4
          },
          "socket_b": {
            "column": 105,
            "elevation": 4
          }
        },
        "platformCells": [],
        "ladderCells": [],
        "taps": {
          "gas": {
            "capacity": 38,
            "includeRoomInventory": true,
            "roomPortHeight": 0.72,
            "sourceIds": []
          },
          "liquid": {
            "capacity": 32,
            "includeRoomInventory": true,
            "roomPortHeight": 0.12,
            "sourceIds": []
          }
        },
        "graftSlots": [],
        "provenance": "site"
      },
      "gallery": {
        "id": "gallery",
        "code": "PEL-4",
        "structure": "room",
        "ambientTemperature": 22,
        "socketCount": 2,
        "bounds": {
          "column": 71,
          "elevation": 4,
          "width": 19,
          "height": 14
        },
        "socketCells": {
          "socket_a": {
            "column": 77,
            "elevation": 4
          },
          "socket_b": {
            "column": 84,
            "elevation": 4
          }
        },
        "platformCells": [],
        "ladderCells": [],
        "taps": {
          "gas": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.72,
            "sourceIds": []
          },
          "liquid": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.12,
            "sourceIds": []
          }
        },
        "graftSlots": [],
        "provenance": "site"
      },
      "reservoir": {
        "id": "reservoir",
        "code": "PEL-3",
        "structure": "room",
        "ambientTemperature": 22,
        "socketCount": 2,
        "bounds": {
          "column": 49,
          "elevation": 4,
          "width": 21,
          "height": 14
        },
        "socketCells": {
          "socket_a": {
            "column": 56,
            "elevation": 4
          },
          "socket_b": {
            "column": 64,
            "elevation": 4
          }
        },
        "platformCells": [],
        "ladderCells": [],
        "taps": {
          "gas": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.72,
            "sourceIds": [
              "specialty_gas_reservoir"
            ]
          },
          "liquid": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.12,
            "sourceIds": []
          }
        },
        "graftSlots": [],
        "provenance": "site"
      },
      "switchyard": {
        "id": "switchyard",
        "code": "PEL-1",
        "structure": "room",
        "ambientTemperature": 22,
        "socketCount": 2,
        "bounds": {
          "column": 29,
          "elevation": 4,
          "width": 19,
          "height": 14
        },
        "socketCells": {
          "socket_a": {
            "column": 35,
            "elevation": 4
          },
          "socket_b": {
            "column": 42,
            "elevation": 4
          }
        },
        "platformCells": [],
        "ladderCells": [],
        "taps": {
          "gas": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.72,
            "sourceIds": []
          },
          "liquid": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.12,
            "sourceIds": []
          }
        },
        "graftSlots": [],
        "provenance": "site"
      },
      "furnace": {
        "id": "furnace",
        "code": "PEL-2",
        "structure": "room",
        "ambientTemperature": 22,
        "socketCount": 2,
        "bounds": {
          "column": 8,
          "elevation": 4,
          "width": 20,
          "height": 14
        },
        "socketCells": {
          "socket_a": {
            "column": 14,
            "elevation": 4
          },
          "socket_b": {
            "column": 22,
            "elevation": 4
          }
        },
        "platformCells": [],
        "ladderCells": [],
        "taps": {
          "gas": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.72,
            "sourceIds": []
          },
          "liquid": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.12,
            "sourceIds": []
          }
        },
        "graftSlots": [],
        "provenance": "site"
      },
      "west_intake": {
        "id": "west_intake",
        "code": "PEL-0",
        "structure": "entry",
        "ambientTemperature": 22,
        "socketCount": 0,
        "bounds": {
          "column": 2,
          "elevation": 4,
          "width": 5,
          "height": 10
        },
        "socketCells": {},
        "platformCells": [],
        "ladderCells": [],
        "taps": {
          "gas": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.72,
            "sourceIds": []
          },
          "liquid": {
            "capacity": 18,
            "includeRoomInventory": true,
            "roomPortHeight": 0.12,
            "sourceIds": []
          }
        },
        "graftSlots": [],
        "provenance": "site"
      }
    },
    "connections": {
      "site_route_1:west_intake__furnace": {
        "id": "site_route_1:west_intake__furnace",
        "rooms": [
          "west_intake",
          "furnace"
        ],
        "hostRoomId": "west_intake",
        "defaultOpen": true,
        "defaultSealed": false,
        "sealGroupId": "site_seal:site_route_1:west_intake__furnace",
        "gasConductance": 0.22,
        "liquidConductance": 0.24,
        "aperture": 1,
        "kind": "passage",
        "connectorCells": [
          {
            "column": 7,
            "elevation": 4
          }
        ],
        "endpoints": [
          {
            "column": 6,
            "elevation": 4
          },
          {
            "column": 8,
            "elevation": 4
          }
        ],
        "orientation": "horizontal",
        "sillElevation": 4,
        "liquidMode": "spill"
      },
      "site_route_2:furnace__switchyard": {
        "id": "site_route_2:furnace__switchyard",
        "rooms": [
          "furnace",
          "switchyard"
        ],
        "hostRoomId": "furnace",
        "defaultOpen": true,
        "defaultSealed": false,
        "sealGroupId": "site_seal:site_route_2:furnace__switchyard",
        "gasConductance": 0.22,
        "liquidConductance": 0.24,
        "aperture": 1,
        "kind": "passage",
        "connectorCells": [
          {
            "column": 28,
            "elevation": 4
          }
        ],
        "endpoints": [
          {
            "column": 27,
            "elevation": 4
          },
          {
            "column": 29,
            "elevation": 4
          }
        ],
        "orientation": "horizontal",
        "sillElevation": 4,
        "liquidMode": "spill"
      },
      "site_route_3:switchyard__reservoir": {
        "id": "site_route_3:switchyard__reservoir",
        "rooms": [
          "switchyard",
          "reservoir"
        ],
        "hostRoomId": "switchyard",
        "defaultOpen": true,
        "defaultSealed": false,
        "sealGroupId": "site_seal:site_route_3:switchyard__reservoir",
        "gasConductance": 0.22,
        "liquidConductance": 0.24,
        "aperture": 1,
        "kind": "passage",
        "connectorCells": [
          {
            "column": 48,
            "elevation": 4
          }
        ],
        "endpoints": [
          {
            "column": 47,
            "elevation": 4
          },
          {
            "column": 49,
            "elevation": 4
          }
        ],
        "orientation": "horizontal",
        "sillElevation": 4,
        "liquidMode": "spill"
      },
      "site_route_4:reservoir__gallery": {
        "id": "site_route_4:reservoir__gallery",
        "rooms": [
          "reservoir",
          "gallery"
        ],
        "hostRoomId": "reservoir",
        "defaultOpen": true,
        "defaultSealed": false,
        "sealGroupId": "site_seal:site_route_4:reservoir__gallery",
        "gasConductance": 0.22,
        "liquidConductance": 0.24,
        "aperture": 1,
        "kind": "passage",
        "connectorCells": [
          {
            "column": 70,
            "elevation": 4
          }
        ],
        "endpoints": [
          {
            "column": 69,
            "elevation": 4
          },
          {
            "column": 71,
            "elevation": 4
          }
        ],
        "orientation": "horizontal",
        "sillElevation": 4,
        "liquidMode": "spill"
      },
      "site_route_5:gallery__lower_intake": {
        "id": "site_route_5:gallery__lower_intake",
        "rooms": [
          "gallery",
          "lower_intake"
        ],
        "hostRoomId": "gallery",
        "defaultOpen": true,
        "defaultSealed": false,
        "sealGroupId": "site_seal:site_route_5:gallery__lower_intake",
        "gasConductance": 0.22,
        "liquidConductance": 0.24,
        "aperture": 1,
        "kind": "passage",
        "connectorCells": [
          {
            "column": 90,
            "elevation": 4
          }
        ],
        "endpoints": [
          {
            "column": 89,
            "elevation": 4
          },
          {
            "column": 91,
            "elevation": 4
          }
        ],
        "orientation": "horizontal",
        "sillElevation": 4,
        "liquidMode": "spill"
      },
      "site_route_6:lower_intake__washlock": {
        "id": "site_route_6:lower_intake__washlock",
        "rooms": [
          "lower_intake",
          "washlock"
        ],
        "hostRoomId": "lower_intake",
        "defaultOpen": true,
        "defaultSealed": false,
        "sealGroupId": "site_seal:site_route_6:lower_intake__washlock",
        "gasConductance": 0.22,
        "liquidConductance": 0.24,
        "aperture": 1,
        "kind": "passage",
        "connectorCells": [
          {
            "column": 111,
            "elevation": 4
          }
        ],
        "endpoints": [
          {
            "column": 110,
            "elevation": 4
          },
          {
            "column": 112,
            "elevation": 4
          }
        ],
        "orientation": "horizontal",
        "sillElevation": 4,
        "liquidMode": "spill"
      },
      "washlock_to_core_door": {
        "id": "washlock_to_core_door",
        "kind": "core_door",
        "rooms": [
          "washlock",
          "core"
        ],
        "connectorCells": [
          {
            "column": 131,
            "elevation": 4
          },
          {
            "column": 132,
            "elevation": 4
          }
        ],
        "endpoints": [
          {
            "column": 130,
            "elevation": 4
          },
          {
            "column": 133,
            "elevation": 4
          }
        ],
        "orientation": "horizontal",
        "sillElevation": 4,
        "aperture": 2,
        "gasConductance": 0,
        "liquidConductance": 0,
        "liquidMode": "blocked",
        "hostRoomId": "washlock",
        "defaultOpen": false,
        "defaultSealed": true,
        "sealGroupId": null
      }
    },
    "utilityNodes": {
      "gas_reservoir": {
        "cell": {
          "column": 136,
          "elevation": 16
        },
        "hostRoomId": "core"
      },
      "hazard_gas_reservoir": {
        "cell": {
          "column": 115,
          "elevation": 6
        },
        "hostRoomId": "washlock"
      },
      "liquid_reservoir_a": {
        "cell": {
          "column": 136,
          "elevation": 6
        },
        "hostRoomId": "core"
      },
      "liquid_reservoir_b": {
        "cell": {
          "column": 140,
          "elevation": 6
        },
        "hostRoomId": "core"
      },
      "hazard_liquid_reservoir": {
        "cell": {
          "column": 124,
          "elevation": 6
        },
        "hostRoomId": "washlock"
      },
      "gas_vent": {
        "cell": {
          "column": 146,
          "elevation": 16
        },
        "hostRoomId": "core"
      },
      "liquid_drain": {
        "cell": {
          "column": 146,
          "elevation": 6
        },
        "hostRoomId": "core"
      },
      "specialty_gas_reservoir": {
        "cell": {
          "column": 51,
          "elevation": 6
        },
        "hostRoomId": "reservoir"
      }
    }
  }
} as const satisfies Partial<Record<CanonicalLevelId, WorldMap>>;
