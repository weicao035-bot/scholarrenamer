
import { PaperMetadata } from "../types";

/**
 * 纯本地启发式算法提取元数据 (不使用任何 AI API)
 * 模拟 Python 常用的正则提取逻辑
 */
export const extractMetadataLocally = (text: string): PaperMetadata => {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  // 1. 提取年份 (查找 1900-2029 之间的数字)
  const yearRegex = /\b(19|20)\d{2}\b/g;
  const yearsFound = text.match(yearRegex) || [];
  // 通常第一个出现的合理年份是发表年份，或者取出现频率最高的
  const year = yearsFound.length > 0 ? yearsFound[0] : "UnknownYear";

  // 2. 提取标题 (通常在前 10 行中，排除掉一些常见的页眉信息)
  // 启发式：前 10 行中长度超过 20 个字符且不是全大写的行可能是标题
  let title = "UnknownTitle";
  for (let i = 0; i < Math.min(lines.length, 15); i++) {
    const line = lines[i];
    // 过滤掉纯数字、太短的行、包含特定 URL 或版权信息的行
    if (line.length > 20 && !line.includes('http') && !line.includes('©') && !line.includes('doi')) {
      title = line;
      break;
    }
  }

  // 3. 提取作者 (通常在标题后面)
  // 查找包含逗号分隔或 "and" 的行
  let author = "UnknownAuthor";
  const titleIndex = lines.indexOf(title);
  if (titleIndex !== -1) {
    for (let i = titleIndex + 1; i < titleIndex + 5; i++) {
      if (lines[i] && (lines[i].includes(',') || lines[i].split(' ').length <= 4)) {
        // 取第一个单词作为姓氏
        author = lines[i].split(',')[0].split(' ').pop() || lines[i];
        break;
      }
    }
  }

  // 4. 提取期刊 (寻找关键词如 Journal, Conference, Proceedings)
  let journal = "UnknownJournal";
  const journalKeywords = [/journal/i, /proceedings/i, /conference/i, /nature/i, /science/i, /transactions/i, /letters/i];
  for (const line of lines.slice(0, 30)) {
    if (journalKeywords.some(regex => regex.test(line))) {
      journal = line.substring(0, 100);
      break;
    }
  }

  return {
    year: year.substring(0, 4),
    author: author.replace(/[^a-zA-Z]/g, ''), // 仅保留字母
    title: title.substring(0, 150),
    journal: journal.substring(0, 50),
    translatedTitle: "" // 纯本地无法翻译
  };
};
