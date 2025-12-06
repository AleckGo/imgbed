'use client'
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import React, { useRef } from 'react';
import { faLink, faInfo, faDownload, faTrash, faCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { PhotoProvider, PhotoView } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';

export default function ImageGrid({ data: initialData = [] }) {
    const [data, setData] = useState(initialData);
    const [selectedItem, setSelectedItem] = useState(null);
    const [hoveredId, setHoveredId] = useState(null);
    const modalRef = useRef(null);

    useEffect(() => {
        setData(initialData);
    }, [initialData]);

    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    const getImgUrl = (url) => {
        return url.startsWith("/file/") || url.startsWith("/cfile/") || url.startsWith("/rfile/") 
            ? `${origin}/api${url}` 
            : url;
    };

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            toast.success(`链接复制成功`);
        });
    };

    const deleteItem = async (initName) => {
        try {
            const res = await fetch(`/api/admin/delete`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: initName,
                }),
            });
            const res_data = await res.json();
            if (res_data.success) {
                toast.success('删除成功!');
                setData(prevData => prevData.filter(item => item.url !== initName));
                setSelectedItem(null);
            } else {
                toast.error(res_data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleDelete = async (initName) => {
        const confirmed = window.confirm('你确定要删除这个项目吗？');
        if (confirmed) {
            await deleteItem(initName);
        }
    };

    const downloadFile = (url, filename) => {
        const a = document.createElement('a');
        a.href = getImgUrl(url);
        a.download = filename || 'download';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    function getLastSegment(url) {
        const lastSlashIndex = url.lastIndexOf('/');
        return url.substring(lastSlashIndex + 1);
    }

    const getFileExtension = (url) => {
        const parts = url.split('.');
        return parts.length > 1 ? parts.pop().toLowerCase() : '';
    };

    const renderThumbnail = (fileUrl, index) => {
        const _url = getLastSegment(fileUrl);
        const fileExtension = getFileExtension(_url);

        const imageExtensions = [
            'jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'tif', 'webp',
            'svg', 'ico', 'heic', 'heif', 'raw', 'psd', 'ai', 'eps'
        ];

        const videoExtensions = [
            'mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', 'ogg',
            'ogv', 'm4v', '3gp', '3g2', 'mpg', 'mpeg', 'mxf', 'vob'
        ];

        if (imageExtensions.includes(fileExtension)) {
            return (
                <img
                    src={getImgUrl(fileUrl)}
                    alt={`Image ${index}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        e.target.src = '/img/blocked.png';
                    }}
                />
            );
        } else if (videoExtensions.includes(fileExtension)) {
            return (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-3xl mb-2">🎬</div>
                        <div className="text-white text-xs">{fileExtension.toUpperCase()}</div>
                    </div>
                </div>
            );
        } else {
            return (
                <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-3xl mb-2">📄</div>
                        <div className="text-white text-xs">{fileExtension.toUpperCase()}</div>
                    </div>
                </div>
            );
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('zh-CN');
    };

    const getRatingText = (rating) => {
        const ratingMap = { 1: '安全', 2: '审核中', 3: '已屏蔽' };
        return ratingMap[rating] || '未知';
    };

    return (
        <div className="w-full">
            <PhotoProvider>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                    {data.map((item, index) => (
                        <div
                            key={item.id || index}
                            className="relative group bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300"
                            onMouseEnter={() => setHoveredId(item.id || index)}
                            onMouseLeave={() => setHoveredId(null)}
                        >
                            {/* 缩略图 */}
                            <PhotoView src={getImgUrl(item.url)}>
                                <div className="aspect-square overflow-hidden bg-gray-200 cursor-pointer">
                                    {renderThumbnail(item.url, index)}
                                </div>
                            </PhotoView>

                            {/* 悬停时显示的操作菜单 */}
                            {hoveredId === (item.id || index) && (
                                <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center gap-3 z-10">
                                    <div className="flex gap-2">
                                        {/* 复制链接按钮 */}
                                        <button
                                            onClick={() => handleCopy(getImgUrl(item.url))}
                                            className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors"
                                            title="复制链接"
                                        >
                                            <FontAwesomeIcon icon={faLink} size="lg" />
                                        </button>

                                        {/* 查看详情按钮 */}
                                        <button
                                            onClick={() => setSelectedItem(item)}
                                            className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors"
                                            title="查看详情"
                                        >
                                            <FontAwesomeIcon icon={faInfo} size="lg" />
                                        </button>

                                        {/* 下载按钮 */}
                                        <button
                                            onClick={() => downloadFile(item.url, getLastSegment(item.url))}
                                            className="p-2 bg-purple-500 hover:bg-purple-600 text-white rounded-full transition-colors"
                                            title="下载"
                                        >
                                            <FontAwesomeIcon icon={faDownload} size="lg" />
                                        </button>

                                        {/* 删除按钮 */}
                                        <button
                                            onClick={() => handleDelete(item.url)}
                                            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                                            title="删除"
                                        >
                                            <FontAwesomeIcon icon={faTrash} size="lg" />
                                        </button>
                                    </div>

                                    {/* 基本信息预览 */}
                                    <div className="text-white text-xs text-center px-2">
                                        <div className="truncate">{getLastSegment(item.url)}</div>
                                        <div className="text-gray-300">访问: {item.total || 0} 次</div>
                                    </div>
                                </div>
                            )}

                            {/* 卡片底部信息 */}
                            <div className="p-3 bg-gray-50">
                                <div className="text-xs text-gray-600 truncate mb-1" title={item.url}>
                                    {getLastSegment(item.url)}
                                </div>
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>{formatDate(item.time)}</span>
                                    <span className="inline-block px-2 py-1 bg-gray-200 rounded text-xs">
                                        {getRatingText(item.rating)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {data.length === 0 && (
                    <div className="flex justify-center items-center h-64 text-gray-400">
                        <div className="text-center">
                            <div className="text-4xl mb-2">📁</div>
                            <div>暂无图片</div>
                        </div>
                    </div>
                )}
            </PhotoProvider>

            {/* 详情模态框 */}
            {selectedItem && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedItem(null)}
                >
                    <div
                        ref={modalRef}
                        className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="sticky top-0 bg-gray-100 px-6 py-4 border-b flex justify-between items-center">
                            <h2 className="text-lg font-bold">图片详情</h2>
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* 图片预览 */}
                            <div className="mb-4">
                                <img
                                    src={getImgUrl(selectedItem.url)}
                                    alt="Preview"
                                    className="max-w-full max-h-48 mx-auto rounded"
                                    onError={(e) => {
                                        e.target.src = '/img/blocked.png';
                                    }}
                                />
                            </div>

                            {/* 详细信息 */}
                            <div className="space-y-3">
                                <div className="border-l-4 border-blue-500 pl-3">
                                    <div className="text-sm text-gray-500">URL</div>
                                    <div className="text-sm font-mono text-gray-700 break-all">
                                        {selectedItem.url}
                                    </div>
                                </div>

                                <div className="border-l-4 border-green-500 pl-3">
                                    <div className="text-sm text-gray-500">访问次数</div>
                                    <div className="text-sm text-gray-700">{selectedItem.total || 0} 次</div>
                                </div>

                                <div className="border-l-4 border-yellow-500 pl-3">
                                    <div className="text-sm text-gray-500">审核状态</div>
                                    <div className="text-sm text-gray-700">
                                        {getRatingText(selectedItem.rating)}
                                    </div>
                                </div>

                                <div className="border-l-4 border-purple-500 pl-3">
                                    <div className="text-sm text-gray-500">上传日期</div>
                                    <div className="text-sm text-gray-700">{formatDate(selectedItem.time)}</div>
                                </div>

                                <div className="border-l-4 border-gray-500 pl-3">
                                    <div className="text-sm text-gray-500">来源</div>
                                    <div className="text-sm text-gray-700 break-all">{selectedItem.referer || '-'}</div>
                                </div>

                                <div className="border-l-4 border-pink-500 pl-3">
                                    <div className="text-sm text-gray-500">IP 地址</div>
                                    <div className="text-sm text-gray-700">{selectedItem.ip || '-'}</div>
                                </div>
                            </div>

                            {/* 操作按钮 */}
                            <div className="flex gap-2 pt-4 border-t">
                                <button
                                    onClick={() => {
                                        handleCopy(getImgUrl(selectedItem.url));
                                        setSelectedItem(null);
                                    }}
                                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                                >
                                    <FontAwesomeIcon icon={faCheck} size="sm" />
                                    复制链接
                                </button>
                                <button
                                    onClick={() => {
                                        downloadFile(selectedItem.url, getLastSegment(selectedItem.url));
                                        setSelectedItem(null);
                                    }}
                                    className="flex-1 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
                                >
                                    <FontAwesomeIcon icon={faDownload} size="sm" />
                                    下载
                                </button>
                                <button
                                    onClick={() => {
                                        handleDelete(selectedItem.url);
                                        setSelectedItem(null);
                                    }}
                                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                                >
                                    <FontAwesomeIcon icon={faTrash} size="sm" />
                                    删除
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
