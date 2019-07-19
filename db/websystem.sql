-- phpMyAdmin SQL Dump
-- version 4.8.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Czas generowania: 19 Lip 2019, 20:51
-- Wersja serwera: 10.1.31-MariaDB
-- Wersja PHP: 7.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Baza danych: `websystem`
--

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `application`
--

CREATE TABLE `application` (
  `id_application` int(11) NOT NULL,
  `id_event` int(11) NOT NULL,
  `id_User` int(11) NOT NULL,
  `state` int(11) NOT NULL,
  `zw` int(11) DEFAULT NULL,
  `date` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_polish_ci;

--
-- Zrzut danych tabeli `application`
--

INSERT INTO `application` (`id_application`, `id_event`, `id_User`, `state`, `zw`, `date`) VALUES
(1, 3, 9, 1, NULL, '0000-00-00'),
(7, 3, 9, 1, NULL, '0000-00-00'),
(9, 3, 9, 1, NULL, '0000-00-00'),
(10, 3, 9, 1, NULL, '2019-07-11'),
(11, 3, 9, 1, NULL, '2019-07-16'),
(13, 3, 9, 1, NULL, '2019-07-16'),
(14, 3, 9, 1, NULL, '2019-07-16'),
(15, 3, 9, 1, NULL, '2019-07-19');

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `employee`
--

CREATE TABLE `employee` (
  `id_employee` int(11) NOT NULL,
  `Name` varchar(255) COLLATE utf8mb4_polish_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_polish_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_polish_ci NOT NULL,
  `pesel` int(11) DEFAULT NULL,
  `adres` text COLLATE utf8mb4_polish_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_polish_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `event`
--

CREATE TABLE `event` (
  `id_event` int(11) NOT NULL,
  `date` date NOT NULL,
  `city` varchar(255) COLLATE utf8mb4_polish_ci NOT NULL,
  `hotel` varchar(255) COLLATE utf8mb4_polish_ci NOT NULL,
  `NoC` int(11) DEFAULT NULL,
  `time` time NOT NULL,
  `topic` varchar(255) COLLATE utf8mb4_polish_ci NOT NULL,
  `descriptions` text COLLATE utf8mb4_polish_ci NOT NULL,
  `NoI` int(11) NOT NULL,
  `id_trainer` int(11) NOT NULL,
  `id_employee` int(11) DEFAULT NULL,
  `price` int(11) NOT NULL,
  `state` int(11) DEFAULT NULL,
  `program` mediumblob
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_polish_ci;

--
-- Zrzut danych tabeli `event`
--

INSERT INTO `event` (`id_event`, `date`, `city`, `hotel`, `NoC`, `time`, `topic`, `descriptions`, `NoI`, `id_trainer`, `id_employee`, `price`, `state`, `program`) VALUES
(3, '2019-07-08', 'Wroclaw', 'ibis', NULL, '09:00:00', 'Gospodarka odpadami', 'super szkolenie', 0, 1, NULL, 650, 1, NULL);

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `trainer`
--

CREATE TABLE `trainer` (
  `id_trainer` int(11) NOT NULL,
  `Name` varchar(255) COLLATE utf8mb4_polish_ci NOT NULL,
  `description` text COLLATE utf8mb4_polish_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_polish_ci;

--
-- Zrzut danych tabeli `trainer`
--

INSERT INTO `trainer` (`id_trainer`, `Name`, `description`) VALUES
(1, 'Leszek Lewandowicz', 'wlasciciel duzej kancelari podatkowej');

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `user`
--

CREATE TABLE `user` (
  `id_User` int(11) NOT NULL,
  `email` text COLLATE utf8mb4_polish_ci,
  `password` text COLLATE utf8mb4_polish_ci,
  `imie` varchar(255) COLLATE utf8mb4_polish_ci NOT NULL,
  `nazwa` varchar(255) COLLATE utf8mb4_polish_ci DEFAULT NULL,
  `adres` varchar(255) COLLATE utf8mb4_polish_ci DEFAULT NULL,
  `nazwa2` varchar(255) COLLATE utf8mb4_polish_ci DEFAULT NULL,
  `adres2` varchar(255) COLLATE utf8mb4_polish_ci DEFAULT NULL,
  `NIP` int(11) DEFAULT NULL,
  `numer` int(11) DEFAULT NULL,
  `priority` int(11) DEFAULT NULL,
  `type` int(11) DEFAULT NULL,
  `stanowisko` text COLLATE utf8mb4_polish_ci,
  `info` text COLLATE utf8mb4_polish_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_polish_ci;

--
-- Zrzut danych tabeli `user`
--

INSERT INTO `user` (`id_User`, `email`, `password`, `imie`, `nazwa`, `adres`, `nazwa2`, `adres2`, `NIP`, `numer`, `priority`, `type`, `stanowisko`, `info`) VALUES
(9, 'adrian@o2.pl', '$2a$10$0wMSWw0w4lSdNU2yA/yzm.qHCDQAC4QNDFZnv90GWFOLMmpVfrTTi', 'Adrian Szczesny', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(10, 'tom@o2.pl', '$2a$10$7N2KrvivkslcPduMkZ2J.OsubFXRTatF0Bux8aB1tDkMofukeetk2', 'Tom Car', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(11, 'adrianss@o2.pl', '$2a$10$Bv6ERsWBZ.h/kECllzm03OtswPGH.jTkwcCIEcVNG18EJUeepPmXa', 'Adrian', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(12, 'adr@o2.pl', '$2a$10$tVr/uwkVFAhbTidFLaPzUu0HLuUN5MGet4CQ8SaPdPJAuDaQNpHPW', 'adrian lange', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

--
-- Indeksy dla zrzutów tabel
--

--
-- Indeksy dla tabeli `application`
--
ALTER TABLE `application`
  ADD PRIMARY KEY (`id_application`),
  ADD KEY `id_event` (`id_event`),
  ADD KEY `id_User` (`id_User`);

--
-- Indeksy dla tabeli `employee`
--
ALTER TABLE `employee`
  ADD PRIMARY KEY (`id_employee`);

--
-- Indeksy dla tabeli `event`
--
ALTER TABLE `event`
  ADD PRIMARY KEY (`id_event`),
  ADD KEY `id_trainer` (`id_trainer`),
  ADD KEY `id_employee` (`id_employee`);

--
-- Indeksy dla tabeli `trainer`
--
ALTER TABLE `trainer`
  ADD PRIMARY KEY (`id_trainer`);

--
-- Indeksy dla tabeli `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id_User`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT dla tabeli `application`
--
ALTER TABLE `application`
  MODIFY `id_application` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT dla tabeli `employee`
--
ALTER TABLE `employee`
  MODIFY `id_employee` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT dla tabeli `event`
--
ALTER TABLE `event`
  MODIFY `id_event` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT dla tabeli `trainer`
--
ALTER TABLE `trainer`
  MODIFY `id_trainer` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT dla tabeli `user`
--
ALTER TABLE `user`
  MODIFY `id_User` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- Ograniczenia dla zrzutów tabel
--

--
-- Ograniczenia dla tabeli `application`
--
ALTER TABLE `application`
  ADD CONSTRAINT `id_User` FOREIGN KEY (`id_User`) REFERENCES `user` (`id_User`),
  ADD CONSTRAINT `id_event` FOREIGN KEY (`id_event`) REFERENCES `event` (`id_event`);

--
-- Ograniczenia dla tabeli `event`
--
ALTER TABLE `event`
  ADD CONSTRAINT `id_employee` FOREIGN KEY (`id_employee`) REFERENCES `employee` (`id_employee`),
  ADD CONSTRAINT `id_trainer` FOREIGN KEY (`id_trainer`) REFERENCES `trainer` (`id_trainer`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
