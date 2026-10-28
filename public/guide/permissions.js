// Generated from src/auth/permissions.ts. Do not edit by hand; the permissions guard test checks it.
window.ORBIT_PERMISSIONS = {
  "roles": [
    "ORBIT Admin",
    "BMO Lead",
    "Board President",
    "Panelist",
    "Board Recorder",
    "Assignments Officer",
    "HQ Strategic Viewer",
    "CFM / Career Planner"
  ],
  "tools": [
    {
      "title": "Access Admin",
      "purpose": "Roles, board seating, access review, diagnostics and repair",
      "access": {
        "ORBIT Admin": {
          "level": "Owns",
          "note": ""
        },
        "BMO Lead": {
          "level": "Uses",
          "note": "Approves role changes"
        },
        "Board President": null,
        "Panelist": null,
        "Board Recorder": null,
        "Assignments Officer": null,
        "HQ Strategic Viewer": null,
        "CFM / Career Planner": null
      }
    },
    {
      "title": "Panel Oversight",
      "purpose": "Panel progress, AI visibility settings, re-votes, record issues, data freshness",
      "access": {
        "ORBIT Admin": {
          "level": "Full",
          "note": ""
        },
        "BMO Lead": {
          "level": "View",
          "note": ""
        },
        "Board President": {
          "level": "Owns",
          "note": ""
        },
        "Panelist": null,
        "Board Recorder": {
          "level": "View",
          "note": ""
        },
        "Assignments Officer": null,
        "HQ Strategic Viewer": null,
        "CFM / Career Planner": null
      }
    },
    {
      "title": "Command Center",
      "purpose": "Portfolio view of every board: phases, milestones, KPIs, risks",
      "access": {
        "ORBIT Admin": {
          "level": "Full",
          "note": ""
        },
        "BMO Lead": {
          "level": "Owns",
          "note": ""
        },
        "Board President": {
          "level": "View",
          "note": ""
        },
        "Panelist": null,
        "Board Recorder": {
          "level": "View",
          "note": ""
        },
        "Assignments Officer": {
          "level": "View",
          "note": ""
        },
        "HQ Strategic Viewer": {
          "level": "View",
          "note": ""
        },
        "CFM / Career Planner": {
          "level": "View",
          "note": ""
        }
      }
    },
    {
      "title": "Candidate Queue",
      "purpose": "The board's roster of records to review and score",
      "access": {
        "ORBIT Admin": {
          "level": "Full",
          "note": ""
        },
        "BMO Lead": {
          "level": "View",
          "note": ""
        },
        "Board President": {
          "level": "Votes",
          "note": "Plus panel oversight"
        },
        "Panelist": {
          "level": "Votes",
          "note": ""
        },
        "Board Recorder": {
          "level": "View",
          "note": ""
        },
        "Assignments Officer": null,
        "HQ Strategic Viewer": null,
        "CFM / Career Planner": null
      }
    },
    {
      "title": "Panel Workspace",
      "purpose": "One record in 8 lenses, full text, panel chat, and the scoring dock",
      "access": {
        "ORBIT Admin": {
          "level": "Full",
          "note": ""
        },
        "BMO Lead": {
          "level": "View",
          "note": ""
        },
        "Board President": {
          "level": "Votes",
          "note": "Plus re-vote, pin, close thread"
        },
        "Panelist": {
          "level": "Votes",
          "note": ""
        },
        "Board Recorder": {
          "level": "View",
          "note": "Reads chat"
        },
        "Assignments Officer": null,
        "HQ Strategic Viewer": null,
        "CFM / Career Planner": null
      }
    },
    {
      "title": "HELIOS Command",
      "purpose": "Data pipeline: stage gates, failed records, source freshness",
      "access": {
        "ORBIT Admin": {
          "level": "Full",
          "note": ""
        },
        "BMO Lead": {
          "level": "Owns",
          "note": ""
        },
        "Board President": null,
        "Panelist": null,
        "Board Recorder": {
          "level": "Uses",
          "note": ""
        },
        "Assignments Officer": null,
        "HQ Strategic Viewer": {
          "level": "View",
          "note": ""
        },
        "CFM / Career Planner": null
      }
    },
    {
      "title": "Scoring Audit",
      "purpose": "Score outliers, adjudication, rollback playbook",
      "access": {
        "ORBIT Admin": {
          "level": "Full",
          "note": ""
        },
        "BMO Lead": {
          "level": "Uses",
          "note": ""
        },
        "Board President": {
          "level": "Owns",
          "note": ""
        },
        "Panelist": null,
        "Board Recorder": {
          "level": "View",
          "note": ""
        },
        "Assignments Officer": null,
        "HQ Strategic Viewer": null,
        "CFM / Career Planner": null
      }
    },
    {
      "title": "Match Lab",
      "purpose": "Proposes record-to-billet matches; approvals and draft PSDM",
      "access": {
        "ORBIT Admin": {
          "level": "Full",
          "note": ""
        },
        "BMO Lead": {
          "level": "View",
          "note": ""
        },
        "Board President": null,
        "Panelist": null,
        "Board Recorder": null,
        "Assignments Officer": {
          "level": "Owns",
          "note": ""
        },
        "HQ Strategic Viewer": null,
        "CFM / Career Planner": {
          "level": "View",
          "note": ""
        }
      }
    },
    {
      "title": "Cross Analytics",
      "purpose": "Scoring fairness: panelist calibration, endorser context, fit vs panel",
      "access": {
        "ORBIT Admin": {
          "level": "Full",
          "note": ""
        },
        "BMO Lead": {
          "level": "Owns",
          "note": ""
        },
        "Board President": {
          "level": "View",
          "note": ""
        },
        "Panelist": null,
        "Board Recorder": {
          "level": "View",
          "note": ""
        },
        "Assignments Officer": null,
        "HQ Strategic Viewer": {
          "level": "View",
          "note": ""
        },
        "CFM / Career Planner": null
      }
    },
    {
      "title": "Career Planner N-Box",
      "purpose": "Talent grid, loss risk, retention options (never shown to the panel)",
      "access": {
        "ORBIT Admin": {
          "level": "Full",
          "note": ""
        },
        "BMO Lead": null,
        "Board President": null,
        "Panelist": null,
        "Board Recorder": null,
        "Assignments Officer": {
          "level": "View",
          "note": ""
        },
        "HQ Strategic Viewer": null,
        "CFM / Career Planner": {
          "level": "Owns",
          "note": ""
        }
      }
    },
    {
      "title": "Operations Registers",
      "purpose": "Milestones, risks and issues, AAR items, cycle log, packet check, results",
      "access": {
        "ORBIT Admin": {
          "level": "Full",
          "note": ""
        },
        "BMO Lead": {
          "level": "Uses",
          "note": ""
        },
        "Board President": null,
        "Panelist": null,
        "Board Recorder": {
          "level": "Owns",
          "note": ""
        },
        "Assignments Officer": null,
        "HQ Strategic Viewer": {
          "level": "View",
          "note": ""
        },
        "CFM / Career Planner": null
      }
    },
    {
      "title": "DELTA Ledger",
      "purpose": "Hash-chained audit trail of every action; file canonicalizer",
      "access": {
        "ORBIT Admin": {
          "level": "Full",
          "note": ""
        },
        "BMO Lead": {
          "level": "View",
          "note": ""
        },
        "Board President": {
          "level": "View",
          "note": "Own board"
        },
        "Panelist": {
          "level": "Limited",
          "note": "Own entries only"
        },
        "Board Recorder": {
          "level": "Owns",
          "note": ""
        },
        "Assignments Officer": {
          "level": "View",
          "note": ""
        },
        "HQ Strategic Viewer": {
          "level": "View",
          "note": ""
        },
        "CFM / Career Planner": {
          "level": "View",
          "note": ""
        }
      }
    },
    {
      "title": "Board Statistics & Roles",
      "purpose": "One board's population, pace, packets, schedule, and role rights",
      "access": {
        "ORBIT Admin": {
          "level": "Full",
          "note": ""
        },
        "BMO Lead": {
          "level": "Owns",
          "note": ""
        },
        "Board President": {
          "level": "View",
          "note": "Own board"
        },
        "Panelist": {
          "level": "Limited",
          "note": "Scoring tab and other members’ scores hidden until the Order of Merit is certified"
        },
        "Board Recorder": {
          "level": "View",
          "note": ""
        },
        "Assignments Officer": {
          "level": "View",
          "note": ""
        },
        "HQ Strategic Viewer": {
          "level": "View",
          "note": ""
        },
        "CFM / Career Planner": {
          "level": "View",
          "note": ""
        }
      }
    }
  ]
};
