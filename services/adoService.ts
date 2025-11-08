import type { Epic, UserStory } from '../types';

export interface ADOConfig {
  orgUrl: string;
  project: string;
  pat: string;
}

interface WorkItem {
  id: number;
  url: string;
}

// Private fetch wrapper for robust error handling
async function aistudioFetch(url:string, options: RequestInit): Promise<Response> {
    try {
        const response = await fetch(url, options);
        return response;
    } catch (error) {
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
            throw new Error(
                `A network error occurred, preventing connection to Azure DevOps.\n\n` +
                `This is most likely a CORS policy issue on your Azure DevOps organization. An administrator can resolve this by allowing this app's origin under 'Organization Settings > Policies > CORS'.\n\n` +
                `Other potential causes:\n` +
                `1. Incorrect Organization URL.\n` +
                `2. Network/VPN Issue preventing access to dev.azure.com.\n` +
                `3. A browser extension (like an ad-blocker) is blocking the request.`
            );
        }
        // Re-throw other types of errors for generic handling
        throw error;
    }
}


const getApiBaseUrl = (orgUrl: string, project: string) => {
    // Ensure orgUrl doesn't have a trailing slash
    const sanitizedOrgUrl = orgUrl.endsWith('/') ? orgUrl.slice(0, -1) : orgUrl;
    return `${sanitizedOrgUrl}/${encodeURIComponent(project)}/_apis/wit`;
};

// Helper to create the authorization header
const getAuthHeader = (pat: string) => {
  return 'Basic ' + btoa(':' + pat);
};

// Maps our value rating to ADO priority
const mapValueToPriority = (value: 'High' | 'Medium' | 'Low'): number => {
    switch (value) {
        case 'High': return 1;
        case 'Medium': return 2;
        case 'Low': return 3;
        default: return 2;
    }
}

// Tests the connection to ADO
export async function testADOConnection(config: ADOConfig): Promise<string> {
    const sanitizedOrgUrl = config.orgUrl.endsWith('/') ? config.orgUrl.slice(0, -1) : config.orgUrl;
    const apiUrl = `${sanitizedOrgUrl}/_apis/projects/${encodeURIComponent(config.project)}?api-version=7.1-preview.4`;

    const response = await aistudioFetch(apiUrl, {
        method: 'GET',
        headers: {
            'Authorization': getAuthHeader(config.pat),
        },
    });

    if (!response.ok) {
        let errorDetails = `Request failed with status ${response.status} ${response.statusText}`;
        try {
            const errorData = await response.json();
            errorDetails = errorData.message || JSON.stringify(errorData);
        } catch (e) {
            // Response was not JSON, stick with the status text.
        }
        throw new Error(`Connection test failed (Status: ${response.status}): ${errorDetails}. Please check your PAT and Project Name.`);
    }

    const result = await response.json();
    return `Successfully connected to project: "${result.name}"!`;
}


// Creates a single work item
const createWorkItem = async (
    config: ADOConfig, 
    type: 'Epic' | 'Feature' | 'User Story', 
    title: string, 
    details: { description?: string; acceptanceCriteria?: string[]; businessValue?: 'High' | 'Medium' | 'Low'; riskImpact?: string }
): Promise<WorkItem> => {
    const apiUrl = `${getApiBaseUrl(config.orgUrl, config.project)}/workitems/$${type}?api-version=7.1-preview.3`;
    
    const patchDocument: any[] = [
        { op: 'add', path: '/fields/System.Title', value: title }
    ];

    let fullDescription = '';
    if (details.description) {
        fullDescription += `<p>${details.description}</p>`;
    }
    if (details.riskImpact) {
         fullDescription += `<br><b>Risk/Impact:</b> ${details.riskImpact}`;
    }

    if (fullDescription) {
        patchDocument.push({ op: 'add', path: '/fields/System.Description', value: fullDescription });
    }
    
    if (details.acceptanceCriteria) {
        const criteriaHtml = details.acceptanceCriteria.map(ac => `<li>${ac}</li>`).join('');
        patchDocument.push({ op: 'add', path: '/fields/Microsoft.VSTS.Common.AcceptanceCriteria', value: `<ul>${criteriaHtml}</ul>` });
    }
    if (details.businessValue) {
        patchDocument.push({ op: 'add', path: '/fields/Microsoft.VSTS.Common.Priority', value: mapValueToPriority(details.businessValue) });
    }

    const response = await aistudioFetch(apiUrl, {
        method: 'POST',
        headers: {
            'Authorization': getAuthHeader(config.pat),
            'Content-Type': 'application/json-patch+json',
        },
        body: JSON.stringify(patchDocument),
    });

    if (!response.ok) {
        let errorDetails = `Request failed with status ${response.status} ${response.statusText}`;
        try {
            const errorData = await response.json();
            errorDetails = errorData.message || JSON.stringify(errorData);
        } catch (e) {
            // Response was not JSON, stick with the status text.
        }
        throw new Error(`Failed to create ${type} in ADO (Status: ${response.status}): ${errorDetails}`);
    }

    const result = await response.json();
    return { id: result.id, url: result.url };
};

// Adds a Parent link to a child work item
const addParentLink = async (config: ADOConfig, childUrl: string, parentUrl: string): Promise<void> => {
    const apiUrl = `${childUrl}?api-version=7.1-preview.3`;

    const patchDocument = [{
        op: 'add',
        path: '/relations/-',
        value: {
            rel: 'System.LinkTypes.Hierarchy-Reverse',
            url: parentUrl,
            attributes: { comment: 'Parent' }
        }
    }];

    const response = await aistudioFetch(apiUrl, {
        method: 'PATCH',
        headers: {
            'Authorization': getAuthHeader(config.pat),
            'Content-Type': 'application/json-patch+json',
        },
        body: JSON.stringify(patchDocument),
    });

    if (!response.ok) {
        let errorDetails = `Request failed with status ${response.status} ${response.statusText}`;
         try {
            const errorData = await response.json();
            errorDetails = errorData.message || JSON.stringify(errorData);
        } catch (e) { /* Ignore */ }
        throw new Error(`Failed to link child to parent (Status: ${response.status}): ${errorDetails}`);
    }
};


const addDependencyLink = async (config: ADOConfig, storyUrl: string, dependencyUrl: string): Promise<void> => {
    const apiUrl = `${storyUrl}?api-version=7.1-preview.3`;
    
    const patchDocument = [{
        op: 'add',
        path: '/relations/-',
        value: {
            rel: 'System.LinkTypes.Dependency',
            url: dependencyUrl,
            attributes: { comment: 'Depends on this story' }
        }
    }];

    const response = await aistudioFetch(apiUrl, {
        method: 'PATCH',
        headers: {
            'Authorization': getAuthHeader(config.pat),
            'Content-Type': 'application/json-patch+json',
        },
        body: JSON.stringify(patchDocument),
    });

    if (!response.ok) {
        let errorDetails = `Request failed with status ${response.status} ${response.statusText}`;
        try {
            const errorData = await response.json();
            errorDetails = errorData.message || JSON.stringify(errorData);
        } catch (e) {
            // Response was not JSON, stick with the status text.
        }
        // Throw an error so Promise.allSettled can catch it
        throw new Error(`Failed to link dependency to ${storyUrl} (Status: ${response.status}): ${errorDetails}`);
    }
};


export async function exportToADO(config: ADOConfig, epics: Epic[], onProgress: (message: string) => void): Promise<void> {
    const storyIdToAdoWorkItemMap = new Map<string, WorkItem>();

    onProgress("Starting export to Azure DevOps...");

    for (const epic of epics) {
        onProgress(`Creating Epic: "${epic.epic}"`);
        const epicWorkItem = await createWorkItem(config, 'Epic', epic.epic, { description: epic.epic_description });

        for (const feature of epic.features) {
            onProgress(`Creating Feature: "${feature.feature}"`);
            const featureWorkItem = await createWorkItem(config, 'Feature', feature.feature, { description: feature.feature_description });
            
            onProgress(`Linking Feature "${feature.feature}" to Epic`);
            await addParentLink(config, featureWorkItem.url, epicWorkItem.url);

            for (const story of feature.user_stories) {
                 onProgress(`Creating User Story: "${story.id}"`);
                 const storyWorkItem = await createWorkItem(config, 'User Story', story.story, { 
                    acceptanceCriteria: story.acceptance_criteria,
                    businessValue: story.business_value,
                    riskImpact: story.risk_impact
                });
                onProgress(`Linking Story "${story.id}" to Feature`);
                await addParentLink(config, storyWorkItem.url, featureWorkItem.url);
                
                storyIdToAdoWorkItemMap.set(story.id, storyWorkItem);
            }
        }
    }
    
    onProgress("All work items created. Adding dependency links...");

    const allStories: UserStory[] = epics.flatMap(e => e.features.flatMap(f => f.user_stories));
    const linkPromises: Promise<void>[] = [];

    for (const story of allStories) {
        if (story.dependencies && story.dependencies.length > 0) {
            const storyWorkItem = storyIdToAdoWorkItemMap.get(story.id);
            if (!storyWorkItem) continue;

            for (const depId of story.dependencies) {
                const dependencyWorkItem = storyIdToAdoWorkItemMap.get(depId);
                if (dependencyWorkItem) {
                    onProgress(`Linking ${story.id} -> ${depId}`);
                    // Collect all promises to be executed in parallel.
                    linkPromises.push(addDependencyLink(config, storyWorkItem.url, dependencyWorkItem.url));
                }
            }
        }
    }

    // Wait for all linking requests to finish before proceeding.
    if (linkPromises.length > 0) {
        const results = await Promise.allSettled(linkPromises);
        const failedLinks = results.filter(result => result.status === 'rejected');
        if (failedLinks.length > 0) {
            console.warn(`${failedLinks.length} dependency links failed to be created. Check console for details.`);
            failedLinks.forEach(link => console.error((link as PromiseRejectedResult).reason));
        }
    }
    

    onProgress("Export complete!");
}