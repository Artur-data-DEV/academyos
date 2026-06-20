import type { SimulationMode } from "@/lib/types/domain";

export const SIMULATION_TIME_LIMIT_SECONDS = 90 * 60;

export const EXAM_BLUEPRINTS: Record<
    string,
    { totalQuestions: number; weights: Record<string, number> }
> = {
    csa: {
        totalQuestions: 60,
        weights: {
            "Platform Overview and Navigation": 7,
            "Instance Configuration": 10,
            "Configuring Applications for Collaboration": 20,
            "Self Service & Automation": 20,
            "Database Management and Platform Security": 30,
            "Data Migration and Integration": 13,
        },
    },
    cad: {
        totalQuestions: 60,
        weights: {
            "Designing and Creating an Application": 20,
            "Application User Interface": 20,
            "Security and Restricting Access": 20,
            "Application Automation": 20,
            "Working with External Data": 10,
            "Managing Applications": 10,
        },
    },
    cis_df: {
        totalQuestions: 75,
        weights: {
            "Govern": 35,
            "Insight": 20,
            "Ingest": 19,
            "Configuration": 15,
            "CSDM Fundamentals": 11,
        },
    },
};

export const MODE_LABELS: Record<SimulationMode, string> = {
    balanced: "Simulado Balanceado",
    review_errors: "Revisão de Erros",
    random: "Aleatório",
};

export const CORRECT_COOLDOWN_DAYS = 7;

