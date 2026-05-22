/**
 * GitHub API client for opening PRs via Octokit.
 *
 * Auth: GITHUB_TOKEN env var — fine-grained PAT with "Contents: Read & Write"
 * and "Pull requests: Read & Write" on the fitthesite repository.
 *
 * Returns null for any operation if credentials are not configured.
 */
import { Octokit } from "@octokit/rest";

const REPO_OWNER = process.env.GITHUB_REPO_OWNER ?? "FitMeshSync";
const REPO_NAME = process.env.GITHUB_REPO_NAME ?? "fitthesite";

function getOctokit(): Octokit | null {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return null;
  return new Octokit({ auth: token });
}

export interface PROptions {
  title: string;
  body: string;
  head: string;       // source branch (new)
  base?: string;      // target branch (default: main)
  labels?: string[];
}

export interface PRResult {
  url: string;
  number: number;
}

/**
 * Create a new branch from `base` (default: main), push `files` to it,
 * then open a PR with the given options.
 *
 * Returns null if GITHUB_TOKEN is not set.
 */
export async function createBranchAndPR(
  branchName: string,
  files: Array<{ path: string; content: string }>,
  prOptions: PROptions
): Promise<PRResult | null> {
  const kit = getOctokit();
  if (!kit) {
    console.warn("[github] GITHUB_TOKEN not set — skipping PR creation");
    return null;
  }

  const base = prOptions.base ?? "main";

  try {
    // 1. Get base branch SHA
    const { data: refData } = await kit.git.getRef({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      ref: `heads/${base}`,
    });
    const baseSha = refData.object.sha;

    // 2. Get base tree
    const { data: baseCommit } = await kit.git.getCommit({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      commit_sha: baseSha,
    });
    const baseTreeSha = baseCommit.tree.sha;

    // 3. Create blobs for each file
    const treeItems = await Promise.all(
      files.map(async (f) => {
        const { data: blob } = await kit.git.createBlob({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          content: Buffer.from(f.content, "utf-8").toString("base64"),
          encoding: "base64",
        });
        return {
          path: f.path,
          mode: "100644" as const,
          type: "blob" as const,
          sha: blob.sha,
        };
      })
    );

    // 4. Create tree
    const { data: newTree } = await kit.git.createTree({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      base_tree: baseTreeSha,
      tree: treeItems,
    });

    // 5. Create commit
    const { data: newCommit } = await kit.git.createCommit({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      message: prOptions.title,
      tree: newTree.sha,
      parents: [baseSha],
    });

    // 6. Create branch ref
    await kit.git.createRef({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      ref: `refs/heads/${branchName}`,
      sha: newCommit.sha,
    });

    // 7. Open PR
    const { data: pr } = await kit.pulls.create({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      title: prOptions.title,
      body: prOptions.body,
      head: branchName,
      base,
    });

    // 8. Add labels if requested
    if (prOptions.labels && prOptions.labels.length > 0) {
      await kit.issues.addLabels({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        issue_number: pr.number,
        labels: prOptions.labels,
      }).catch(() => {
        // Labels may not exist yet — non-fatal
        console.warn("[github] Could not add labels (may not exist in repo)");
      });
    }

    return { url: pr.html_url, number: pr.number };
  } catch (err) {
    console.error("[github] createBranchAndPR failed:", err);
    return null;
  }
}
