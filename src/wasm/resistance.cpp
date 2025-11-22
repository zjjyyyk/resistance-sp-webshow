/**
 * @file resistance.cpp
 * @brief WebAssembly implementation of resistance distance algorithms
 * 
 * This file contains the C++ implementations of:
 * - Push_v_sp: Push-based algorithm for resistance distance
 * - Abwalk_v_sp: v-absorbed random walk algorithm
 * 
 * Modified from the original hpp files to support external v parameter.
 */

#include <vector>
#include <queue>
#include <cstdlib>
#include <ctime>
#include <emscripten.h>

// Simple queue implementation for push algorithm
class SimpleQueue {
private:
    std::vector<int> data;
    std::vector<bool> inQueue;
    size_t front;

public:
    SimpleQueue(int n) : inQueue(n, false), front(0) {
        data.reserve(n);
    }

    void push(int node) {
        if (!inQueue[node]) {
            data.push_back(node);
            inQueue[node] = true;
        }
    }

    int pop() {
        int node = data[front++];
        inQueue[node] = false;
        return node;
    }

    bool empty() {
        return front >= data.size();
    }

    void clear() {
        data.clear();
        front = 0;
        std::fill(inQueue.begin(), inQueue.end(), false);
    }
};

extern "C" {

/**
 * Push_v_sp algorithm
 * 
 * @param n Number of nodes
 * @param m Number of edges
 * @param edgeSources Array of edge source nodes
 * @param edgeTargets Array of edge target nodes
 * @param s Source node
 * @param t Target node
 * @param v Landmark node
 * @param rmax Residual threshold
 * @return Resistance distance between s and t
 */
EMSCRIPTEN_KEEPALIVE
double pushVSp(
    int n,
    int m,
    int* edgeSources,
    int* edgeTargets,
    int s,
    int t,
    int v,
    double rmax
) {
    // Build adjacency list and compute degrees
    std::vector<std::vector<int>> adj(n);
    std::vector<double> degree(n, 0.0);

    for (int i = 0; i < m; i++) {
        int u = edgeSources[i];
        int w = edgeTargets[i];
        adj[u].push_back(w);
        degree[u]++;
    }

    // Push from s
    std::vector<double> rs(n, 0.0);
    std::vector<double> ps(n, 0.0);
    rs[s] = 1.0;

    SimpleQueue queue(n);
    if (s != v) {
        queue.push(s);
    }

    while (!queue.empty()) {
        int u = queue.pop();
        ps[u] += rs[u];

        for (int nei : adj[u]) {
            if (nei == v) continue;
            
            rs[nei] += rs[u] / degree[u];
            
            if (rs[nei] > degree[nei] * rmax) {
                queue.push(nei);
            }
        }

        rs[u] = 0.0;
    }

    // Push from t
    std::vector<double> rt(n, 0.0);
    std::vector<double> pt(n, 0.0);
    rt[t] = 1.0;

    queue.clear();
    if (t != v) {
        queue.push(t);
    }

    while (!queue.empty()) {
        int u = queue.pop();
        pt[u] += rt[u];

        for (int nei : adj[u]) {
            if (nei == v) continue;
            
            rt[nei] += rt[u] / degree[u];
            
            if (rt[nei] > degree[nei] * rmax) {
                queue.push(nei);
            }
        }

        rt[u] = 0.0;
    }

    // Compute resistance distance
    double result = ps[s] / degree[s] + 
                   pt[t] / degree[t] - 
                   ps[t] / degree[s] - 
                   pt[s] / degree[t];

    return result;
}

/**
 * Abwalk_v_sp algorithm
 * 
 * @param n Number of nodes
 * @param m Number of edges
 * @param edgeSources Array of edge source nodes
 * @param edgeTargets Array of edge target nodes
 * @param s Source node
 * @param t Target node
 * @param v Landmark node
 * @param times Number of random walks
 * @param seed Random seed
 * @return Resistance distance between s and t
 */
EMSCRIPTEN_KEEPALIVE
double abwalkVSp(
    int n,
    int m,
    int* edgeSources,
    int* edgeTargets,
    int s,
    int t,
    int v,
    int times,
    unsigned int seed
) {
    // Seed random number generator
    srand(seed);

    // Build adjacency list and compute degrees
    std::vector<std::vector<int>> adj(n);
    std::vector<double> degree(n, 0.0);

    for (int i = 0; i < m; i++) {
        int u = edgeSources[i];
        int w = edgeTargets[i];
        adj[u].push_back(w);
        degree[u]++;
    }

    // Hit counters
    double tauss = 0.0;
    double taust = 0.0;
    double tauts = 0.0;
    double tautt = 0.0;

    // v-absorbed walks from s
    for (int i = 0; i < times; i++) {
        int u = s;
        while (u != v) {
            if (u == s) tauss += 1.0;
            if (u == t) taust += 1.0;
            
            // Random neighbor
            const auto& neighbors = adj[u];
            int idx = rand() % neighbors.size();
            u = neighbors[idx];
        }
    }

    // v-absorbed walks from t
    for (int i = 0; i < times; i++) {
        int u = t;
        while (u != v) {
            if (u == s) tauts += 1.0;
            if (u == t) tautt += 1.0;
            
            // Random neighbor
            const auto& neighbors = adj[u];
            int idx = rand() % neighbors.size();
            u = neighbors[idx];
        }
    }

    // Compute resistance distance
    double result = tauss / (degree[s] * times) -
                   taust / (degree[t] * times) -
                   tauts / (degree[s] * times) +
                   tautt / (degree[t] * times);

    return result;
}

} // extern "C"
