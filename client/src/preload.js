const { contextBridge } = require('electron');
const axios = require('axios').default;

// API base URL
const API_URL = 'http://localhost:3001';

// Debug log function
const debug = (...args) => {
    console.log('[Preload]', ...args);
};

debug('Preload script starting...');

// Função auxiliar para tratar respostas da API
const handleApiResponse = (response) => {
    if (!response || !response.data) {
        throw new Error('Resposta inválida do servidor');
    }
    return response.data;
};

// Função auxiliar para tratar erros da API
const handleApiError = (error) => {
    debug('API Error:', error);
    
    if (!error) {
        throw new Error('Erro desconhecido');
    }

    if (error.code === 'ECONNREFUSED') {
        throw new Error('Não foi possível conectar ao servidor. Verifique se o servidor está rodando.');
    }

    if (error.response) {
        const errorMessage = error.response.data?.erro || error.response.data?.message || 'Erro desconhecido do servidor';
        throw new Error(errorMessage);
    }

    throw new Error(error.message || 'Erro desconhecido');
};

// API methods
const api = {
    produtos: {
        listar: async (page = 1, limit = 10) => {
            try {
                debug('Listing products, page:', page, 'limit:', limit);
                const response = await axios.get(`${API_URL}/produtos`, {
                    params: { page, limit }
                });
                return handleApiResponse(response);
            } catch (error) {
                throw handleApiError(error);
            }
        },
        criar: async (formData) => {
            try {
                debug('Creating product');
                const response = await axios.post(`${API_URL}/produtos`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                return handleApiResponse(response);
            } catch (error) {
                throw handleApiError(error);
            }
        },
        deletar: async (id) => {
            try {
                debug('Deleting product:', id);
                const response = await axios.delete(`${API_URL}/produtos/${id}`);
                return handleApiResponse(response);
            } catch (error) {
                throw handleApiError(error);
            }
        }
    },
    vendas: {
        listar: async (page = 1, limit = 10) => {
            try {
                debug('Listing sales, page:', page, 'limit:', limit);
                const response = await axios.get(`${API_URL}/vendas`, {
                    params: { page, limit }
                });
                return handleApiResponse(response);
            } catch (error) {
                throw handleApiError(error);
            }
        },
        criar: async (dados) => {
            try {
                debug('Creating sale');
                const response = await axios.post(`${API_URL}/vendas`, dados);
                return handleApiResponse(response);
            } catch (error) {
                throw handleApiError(error);
            }
        }
    }
};

debug('Exposing API to renderer process...');

// Expose the API to the renderer process
try {
    contextBridge.exposeInMainWorld('api', api);
    debug('API exposed successfully');
} catch (error) {
    console.error('Failed to expose API:', error);
} 