const Actions = {};

class Report {
    constructor(reportPath) {
        this.path = reportPath;
        this.params = {};
        this.format = null;
        this.size = -1;
    }

    _escapeXml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }
    setParam(name, value) {
        this.params[name] = `<pub:item>
                    <pub:name>${this._escapeXml(name)}</pub:name>
                    <pub:values>
                        <pub:item>${this._escapeXml(value)}</pub:item>
                    </pub:values>
                </pub:item>`
        return this;
    }
    setParams(params) {
        this.params = params.reduce((acc, param) => {
            acc[param.name] = `<pub:item>
                    <pub:name>${this._escapeXml(param.name)}</pub:name>
                    <pub:values>
                        <pub:item>${this._escapeXml(param.value)}</pub:item>
                    </pub:values>
                </pub:item>`
            return acc;
        }, {});
        return this;
    }
    setAttributeFormat(format) {
        const posibleFormat = ['csv', 'pdf', 'rtf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'html', 'xml'];
        if (posibleFormat.includes(format)) {
            this.format = format;
        } else {
            throw new Error('Formato no valido');
        }
        return this;
    }
    getParams() {
        return `<pub:parameterNameValues>${Object.values(this.params).join('')}</pub:parameterNameValues>`;
    }
}

class ReportService extends Report {
    constructor(ctx, { pathReport, params = [], chunkSize, endpoint, onProgress, onError }) {
        super(pathReport);
        this.context = ctx;
        this.setParams(params);
        this.endpoint = endpoint || 'RunReport/RunReport';
        if (chunkSize) this.size = chunkSize;

        this.onProgress = typeof onProgress === 'function' ? onProgress : () => { };
        this.onError = typeof onError === 'function' ? onError : null;

        this.bytes = new Uint8Array(0);
        this._jsonCache = null;
        this._blobCache = null;
    }

    _emitProgress(event) {
        this.onProgress(event);
    }

    // ---------- red ----------

    async _callSoap(bodyXml, soapAction) {
        const response = await Actions.callRest(this.context, {
            endpoint: this.endpoint,
            contentType: 'application/soap+xml;charset=UTF-8',
            responseBodyFormat: 'text',
            body: bodyXml,
            headers: {
                'Accept-Encoding': 'x-gzip',
                SOAPAction: soapAction,
                'Content-Type': 'application/soap+xml;charset=UTF-8'
            },
        });
        this._checkStatus(response);
        return response;
    }

    _checkStatus(response) {
        const statusMessages = {
            401: `No autenticado para ejecutar el reporte ${this.path}`,
            403: `No se tiene permiso para ejecutar el reporte ${this.path}`,
            404: `No se encontró el reporte ${this.path}`,
            412: `Precondición fallida al ejecutar el reporte ${this.path}`,
            500: `Error interno al ejecutar el reporte ${this.path}`,
            502: `Bad Gateway al ejecutar el reporte ${this.path}`,
            503: `Servicio no disponible al ejecutar el reporte ${this.path}`,
        };
        if (statusMessages[response.status]) throw new Error(statusMessages[response.status]);
        if (response.status >= 400) throw new Error(`Error ${response.status} al ejecutar el reporte ${this.path}`);
    }

    // ---------- parseo SOAP ----------

    _parseXmlSafe(soapResponseString) {
        const xmlDoc = new DOMParser().parseFromString(soapResponseString, "text/xml");

        const parseError = xmlDoc.getElementsByTagName("parsererror");
        if (parseError.length > 0) {
            throw new Error("Error al parsear el XML de respuesta SOAP " + parseError[0].textContent);
        }

        const faultNode = xmlDoc.getElementsByTagNameNS("*", "Fault")[0];
        if (faultNode) {
            const faultString = xmlDoc.getElementsByTagNameNS("*", "Reason")[0]?.textContent ||
                xmlDoc.getElementsByTagNameNS("*", "faultstring")[0]?.textContent ||
                "SOAP Fault sin detalle";
            throw new Error(faultString);
        }

        return xmlDoc;
    }

    _parseRunReportResponse(soapResponseString) {
        const xmlDoc = this._parseXmlSafe(soapResponseString);

        const reportBytesNode = xmlDoc.getElementsByTagNameNS("*", "reportBytes")[0];
        const fileIDNode = xmlDoc.getElementsByTagNameNS("*", "reportFileID")[0];

        if (!reportBytesNode || !reportBytesNode.textContent) {
            throw new Error("No se encontró el nodo reportBytes en la respuesta");
        }

        return {
            base64: reportBytesNode.textContent.replace(/\s/g, ''),
            fileID: fileIDNode?.textContent?.trim() || null
        };
    }

    _parseChunkResponse(soapResponseString) {
        const xmlDoc = this._parseXmlSafe(soapResponseString);

        const chunkNode = xmlDoc.getElementsByTagNameNS("*", "reportDataChunk")[0];
        const offsetNode = xmlDoc.getElementsByTagNameNS("*", "reportDataOffset")[0];

        return {
            base64: chunkNode?.textContent?.replace(/\s/g, '') || '',
            offset: offsetNode ? parseInt(offsetNode.textContent, 10) : -1
        };
    }

    // ---------- base64 <-> bytes ----------

    _base64ToBytes(base64Str) {
        if (!base64Str) return new Uint8Array(0);
        const normalized = base64Str
            .replace(/^data:[^;]+;base64,/i, '')
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
        return Uint8Array.from(window.atob(padded), (c) => c.charCodeAt(0));
    }

    _concatBytes(chunksArray) {
        const totalLength = chunksArray.reduce((sum, c) => sum + c.length, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunksArray) {
            result.set(chunk, offset);
            offset += chunk.length;
        }
        return result;
    }

    // ---------- construcción de bodies ----------

    _buildRunReportBody() {
        return `<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:pub="http://xmlns.oracle.com/oxp/service/PublicReportService">
              <soap:Header/>
              <soap:Body>
                  <pub:runReport>
                      <pub:reportRequest>
                         ${this.format ? `<pub:attributeFormat>${this.format}</pub:attributeFormat>` : ''}
                          ${this.getParams()}
                          <pub:reportAbsolutePath>${this.path}</pub:reportAbsolutePath>
                          <pub:sizeOfDataChunkDownload>${this.size}</pub:sizeOfDataChunkDownload>
                      </pub:reportRequest>
                      <pub:appParams/>
                  </pub:runReport>
              </soap:Body>
              </soap:Envelope>`;
    }

    _buildChunkBody(fileID, beginIdx, size) {
        return `<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:pub="http://xmlns.oracle.com/oxp/service/PublicReportService">
              <soap:Header/>
              <soap:Body>
                  <pub:downloadReportDataChunk>
                      <pub:fileID>${this._escapeXml(fileID)}</pub:fileID>
                      <pub:beginIdx>${beginIdx}</pub:beginIdx>
                      <pub:size>${size}</pub:size>
                  </pub:downloadReportDataChunk>
              </soap:Body>
              </soap:Envelope>`;
    }

    // ---------- orquestación ----------

    async run() {
        try {
            this._emitProgress({ stage: 'starting', path: this.path });

            const body = this._buildRunReportBody();
            this._emitProgress({ stage: 'requesting' });

            const response = await this._callSoap(body, 'submitRequest');
            const { base64: firstChunkB64, fileID } = this._parseRunReportResponse(response.body);
            const firstChunkBytes = this._base64ToBytes(firstChunkB64);

            if (this.size > 0) {
                if (!fileID) throw new Error('No se recibió fileID para continuar la descarga en chunks');

                const parts = [firstChunkBytes];
                let beginIdx = firstChunkBytes.length;
                let chunkCount = 1;
                this._emitProgress({ stage: 'chunk', chunkCount, bytesReceived: beginIdx });

                while (true) {
                    const chunkBody = this._buildChunkBody(fileID, beginIdx, this.size);
                    const chunkResponse = await this._callSoap(chunkBody, 'downloadReportDataChunk');
                    const { base64: chunkB64, offset } = this._parseChunkResponse(chunkResponse.body);

                    if (chunkB64) {
                        const bytes = this._base64ToBytes(chunkB64);
                        parts.push(bytes);
                        beginIdx += bytes.length;
                        chunkCount++;
                        this._emitProgress({ stage: 'chunk', chunkCount, bytesReceived: beginIdx });
                    }

                    if (offset === -1) break;
                }

                this.bytes = this._concatBytes(parts);
            } else {
                this.bytes = firstChunkBytes;
            }

            this._emitProgress({ stage: 'done', bytesReceived: this.bytes.length });
            return this;

        } catch (err) {
            this._emitProgress({ stage: 'error', error: err.message });
            if (this.onError) this.onError(err);
            throw err;
        }
    }

    // ---------- salida ----------

    _xmlNodeToJson(node) {
        const children = Array.from(node.children);
        if (children.length === 0) return node.textContent.trim();

        const result = {};
        children.forEach((child) => {
            const tag = child.tagName;
            const value = this._xmlNodeToJson(child);
            if (result[tag] === undefined) {
                result[tag] = value;
            } else if (Array.isArray(result[tag])) {
                result[tag].push(value);
            } else {
                result[tag] = [result[tag], value];
            }
        });
        return result;
    }

    get json() {
        if (this.format !== 'xml') throw new Error('La propiedad .json solo aplica cuando el formato es xml');
        if (!this._jsonCache) {
            const xmlString = new TextDecoder('utf-8', { fatal: true }).decode(this.bytes);
            const xmlDoc = new DOMParser().parseFromString(xmlString, 'application/xml');
            const parserError = xmlDoc.querySelector('parsererror');
            if (parserError) throw new Error(`XML inválido: ${parserError.textContent}`);
            this._jsonCache = this._xmlNodeToJson(xmlDoc.documentElement);
        }
        return this._jsonCache;
    }

    get blob() {
        if (!this._blobCache) {
            const mimeTypes = {
                pdf: 'application/pdf',
                csv: 'text/csv',
                html: 'text/html',
                xml: 'application/xml',
                rtf: 'application/rtf',
                doc: 'application/msword',
                docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                xls: 'application/vnd.ms-excel',
                xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                ppt: 'application/vnd.ms-powerpoint',
                pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
            };
            const mime = mimeTypes[this.format] || 'application/octet-stream';
            this._blobCache = new Blob([this.bytes], { type: mime });
        }
        return this._blobCache;
    }
}