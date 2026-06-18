/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Since Node 18+, globalThis.DOMException or global.DOMException is natively supported.
// This local stub maps to the native implementation to prevent downloading the deprecated npm module.
module.exports = globalThis.DOMException || global.DOMException || Error;
